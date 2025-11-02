document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

          activityCard.innerHTML = `
            <h4>${name}</h4>
            <p>${details.description}</p>
            <p><strong>Schedule:</strong> ${details.schedule}</p>
            <p><strong>Availability:</strong> ${spotsLeft} spots left</p>

            <div class="participants-section">
              <h5>Participants (<span class="participant-count">${details.participants.length}</span>)</h5>
              <ul class="participants-list"></ul>
            </div>
          `;

          // Populate participants list with DOM nodes (so we can attach delete buttons safely)
          const participantsUl = activityCard.querySelector('.participants-list');

          if (details.participants.length === 0) {
            const li = document.createElement('li');
            li.className = 'no-participant';
            li.textContent = 'No participants yet';
            participantsUl.appendChild(li);
          } else {
            details.participants.forEach((p) => {
              const li = document.createElement('li');
              li.className = 'participant-item';

              const span = document.createElement('span');
              span.className = 'participant-email';
              span.textContent = p;

              const btn = document.createElement('button');
              btn.className = 'participant-delete';
              btn.setAttribute('aria-label', `Unregister ${p}`);
              btn.textContent = '✕';

              // When clicked, attempt to unregister participant
              btn.addEventListener('click', async () => {
                if (!confirm(`Unregister ${p} from ${name}?`)) return;

                try {
                  const resp = await fetch(`/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(p)}`, {
                    method: 'DELETE'
                  });

                  const result = await resp.json();
                  if (resp.ok) {
                    // Refresh activities list
                    fetchActivities();
                  } else {
                    alert(result.detail || result.message || 'Failed to unregister participant');
                  }
                } catch (err) {
                  console.error('Error unregistering participant:', err);
                  alert('Error unregistering participant. See console for details.');
                }
              });

              li.appendChild(span);
              li.appendChild(btn);
              participantsUl.appendChild(li);
            });
          }

          activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

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
        signupForm.reset();

        // Refresh activities so the newly-registered participant appears immediately
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
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
