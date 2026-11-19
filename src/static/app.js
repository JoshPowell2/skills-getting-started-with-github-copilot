document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const cardMessages = new Map();

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch(`/activities?timestamp=${Date.now()}`, {
        cache: "no-store",
      });
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const title = document.createElement("h4");
        title.textContent = name;

        const description = document.createElement("p");
        description.textContent = details.description;

        const schedule = document.createElement("p");
        schedule.innerHTML = "<strong>Schedule:</strong> ";
        schedule.append(document.createTextNode(details.schedule));

        const availability = document.createElement("p");
        availability.innerHTML = "<strong>Availability:</strong> ";
        availability.append(document.createTextNode(`${spotsLeft} spots left`));

        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";
        const cardMessage = document.createElement("div");
        cardMessage.className = "activity-card-message";

        const cardMessageData = cardMessages.get(name);
        if (cardMessageData) {
          cardMessage.textContent = cardMessageData.text;
          cardMessage.className = `activity-card-message ${cardMessageData.type}`;
        } else {
          cardMessage.classList.add("hidden");
        }

        const participantsTitle = document.createElement("h5");
        participantsTitle.textContent = "Participants";

        const participantsList = document.createElement("ul");
        participantsList.className = "participants-list";

        if (details.participants.length === 0) {
          const emptyItem = document.createElement("li");
          emptyItem.className = "no-participants";
          emptyItem.textContent = "No one has signed up yet";
          participantsList.appendChild(emptyItem);
        } else {
          details.participants.forEach((participant) => {
            const participantItem = document.createElement("li");

            const participantName = document.createElement("span");
            participantName.textContent = participant;

            const deleteButton = document.createElement("button");
            deleteButton.className = "delete-participant";
            deleteButton.type = "button";
            deleteButton.title = `Unregister ${participant}`;
            deleteButton.setAttribute("aria-label", `Unregister ${participant}`);
            deleteButton.textContent = "×";

            deleteButton.addEventListener("click", async () => {
              try {
                const response = await fetch(
                  `/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(participant)}`,
                  { method: "DELETE" }
                );
                const result = await response.json();

                if (response.ok) {
                  cardMessages.set(name, {
                    text: result.message,
                    type: "success",
                  });
                  await fetchActivities();
                  setTimeout(async () => {
                    cardMessages.delete(name);
                    await fetchActivities();
                  }, 5000);
                } else {
                  cardMessage.textContent = result.detail || "An error occurred";
                  cardMessage.className = "activity-card-message error";
                }
              } catch (error) {
                cardMessage.textContent = "Failed to unregister participant.";
                cardMessage.className = "activity-card-message error";
                console.error("Error unregistering participant:", error);
              }
            });

            participantItem.append(participantName, deleteButton);
            participantsList.appendChild(participantItem);
          });
        }

        participantsSection.append(participantsTitle, participantsList);
        activityCard.append(title, description, schedule, availability, participantsSection, cardMessage);

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
        await fetchActivities();
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
