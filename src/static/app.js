document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  // Removed activitySelect and signupForm
  const messageDiv = document.getElementById("message");
  const searchInput = document.getElementById("search-input");
  const categoryFilter = document.getElementById("category-filter");
  const sortFilter = document.getElementById("sort-filter");

  let allActivities = {};

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();
      allActivities = activities;
      renderActivities();
      populateCategoryFilter();
      // Removed populateActivitySelect()
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }

    // Add event listeners for filters and search
    searchInput.addEventListener("input", renderActivities);
    categoryFilter.addEventListener("change", renderActivities);
    sortFilter.addEventListener("change", renderActivities);
    // Render activities with filters, sorting, and search
    function renderActivities() {
      activitiesList.innerHTML = "";
      let entries = Object.entries(allActivities);

      // Filter by category (if category info exists)
      const selectedCategory = categoryFilter.value;
      if (selectedCategory) {
        entries = entries.filter(([name, details]) => {
          return details.category === selectedCategory;
        });
      }

      // Search filter
      const searchTerm = searchInput.value.trim().toLowerCase();
      if (searchTerm) {
        entries = entries.filter(([name, details]) => {
          return (
            name.toLowerCase().includes(searchTerm) ||
            details.description.toLowerCase().includes(searchTerm) ||
            (details.schedule && details.schedule.toLowerCase().includes(searchTerm))
          );
        });
      }

      // Sort
      const sortBy = sortFilter.value;
      if (sortBy === "name") {
        entries.sort((a, b) => a[0].localeCompare(b[0]));
      } else if (sortBy === "time") {
        entries.sort((a, b) => {
          // Try to extract time from schedule string
          const timeA = a[1].schedule || "";
          const timeB = b[1].schedule || "";
          return timeA.localeCompare(timeB);
        });
      }

      // Render filtered and sorted activities
      if (entries.length === 0) {
        activitiesList.innerHTML = "<p>No activities found.</p>";
        return;
      }

      entries.forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
                <h5>Participants:</h5>
                <ul class="participants-list">
                  ${details.participants
                    .map(
                      (email) =>
                        `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                    )
                    .join("")}
                </ul>
              </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
          <button class="register-btn" data-activity="${name}">Register Student</button>
        `;

        activitiesList.appendChild(activityCard);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });

      // Add event listeners to register buttons
      document.querySelectorAll(".register-btn").forEach((button) => {
        button.addEventListener("click", handleRegister);
      });
    }
    }

    // Populate category filter (if any categories exist)
    function populateCategoryFilter() {
      // Collect unique categories from activities
      const categories = new Set();
      Object.values(allActivities).forEach((details) => {
        if (details.category) {
          categories.add(details.category);
        }
      });
      // Clear and add default option
      categoryFilter.innerHTML = '<option value="">All Categories</option>';
      categories.forEach((cat) => {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat;
        categoryFilter.appendChild(option);
      });
    }

    // Removed populateActivitySelect()
    // Handle register functionality
    async function handleRegister(event) {
      const activity = event.target.getAttribute("data-activity");
      const email = prompt("Enter student email to register:");
      if (!email) return;
      try {
        const response = await fetch(
          `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
          {
            method: "POST",
          }
        );
        const result = await response.json();
        if (response.ok) {
          messageDiv.textContent = result.message;
          messageDiv.className = "success";
          // Refresh activities list to show updated participants
          fetchActivities();
        } else {
          messageDiv.textContent = result.detail || "An error occurred";
          messageDiv.className = "error";
        }
        messageDiv.classList.remove("hidden");
        setTimeout(() => {
          messageDiv.classList.add("hidden");
        }, 5000);
      } catch (error) {
        messageDiv.textContent = "Failed to register. Please try again.";
        messageDiv.className = "error";
        messageDiv.classList.remove("hidden");
        console.error("Error registering:", error);
      }
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Removed signup form submission logic

  // Initialize app
  fetchActivities();
});
