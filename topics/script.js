// script_topics.js

const TOPICS_JSON_PATH = "./data/all.json";

let locale = "it";
let activitiesContainer;
let backButton;
let allData = [];
let incorporatedSite = false;
let selectedSchool = "";
let hideTop = false;

const SCHOOL_LABELS = {
  preschool: "Infanzia",
  primary: "Primaria",
  secondary: "Secondaria 1ª grado",
};

const SUBJECT_LABELS = {
  italian: "Italiano",
  math: "Matematica",
  science: "Scienze",
  history: "Storia",
  geography: "Geografia",
  english: "Inglese",
  french: "Francese",
  spanish: "Spagnolo",
  german: "Tedesco",
  civic: "Educazione Civica",
  religion: "Religione",
  art: "Arte",
  music: "Musica",
  physical: "Educazione Fisica",
  technology: "Tecnologia",
  selfAndOthers: "Il sé e l'altro",
  bodyAndMovement: "Il corpo e il movimento",
  imagesSoundsColors: "Immagini, suoni, colori",
  speechAndWords: "I discorsi e le parole",
  worldExploration: "La conoscenza del mondo",
};

const CLASS_LABELS = {
  1: "1ª",
  2: "2ª",
  3: "3ª",
  4: "4ª",
  5: "5ª",
  preschool: {
    3: "3 anni",
    4: "4 anni",
    5: "5 anni",
  },
};

window.addEventListener("DOMContentLoaded", () => {
  activitiesContainer = document.getElementById("activitiesList");
  backButton = document.getElementById("backButton");
  document.getElementById("activitiesTitle").innerText = t("activitiesTitle");
  document.getElementById("activitiesDescription").innerHTML = t("activitiesDescription");

  disableRightClick();
  getUrlParams();

  fetch(TOPICS_JSON_PATH)
    .then((res) => res.json())
    .then((data) => {
      allData = data;
      populateSelectBoxes(data);

      if (selectedSchool) {
        document.getElementById("schoolSelect").value = selectedSchool;
        document.getElementById("schoolSelect").dispatchEvent(new Event("change"));
        //document.getElementById("schoolSelect").style.display = "none";
      }
    })
    .catch((err) => console.error("Errore nel caricamento dei dati:", err));

  if (incorporatedSite) {
    try {
      document.querySelectorAll(".print").forEach((element) => {
        element.style.display = "none";
      });
      document.querySelectorAll(".printParams").forEach((element) => {
        element.style.display = "none";
      });
    } catch (e) {
      console.log(e);
    }
  }

  let margin = 300;

  if (hideTop) {
    margin = 80;
    try {
      document.querySelectorAll(".print").forEach((element) => {
        element.style.display = "none";
      });
      document.querySelectorAll(".printParams").forEach((element) => {
        element.style.display = "none";
      });
      document.querySelectorAll(".selectors").forEach((element) => {
        element.style.display = "none";
      });
      document.querySelectorAll(".titleContainer").forEach((element) => {
        element.style.display = "none";
      });
      document.querySelectorAll("#activitiesDescription").forEach((element) => {
        element.style.display = "none";
      });
    } catch (e) {
      console.log(e);
    }
  }

  activitiesContainer.style.height = `${window.innerHeight - margin}px`;
  window.addEventListener("resize", () => {
    activitiesContainer.style.height = `${window.innerHeight - margin}px`;
  });
});

function populateSelectBoxes(data) {
  const schoolSelect = document.getElementById("schoolSelect");
  const subjectSelect = document.getElementById("subjectSelect");
  const classSelect = document.getElementById("classSelect");

  const schools = [...new Set(data.map((d) => d.school))];
  schools.forEach((school) => {
    const option = document.createElement("option");
    option.value = school;
    option.textContent = SCHOOL_LABELS[school] || school;
    schoolSelect.appendChild(option);
  });

  schoolSelect.addEventListener("change", () => {
    subjectSelect.innerHTML = '<option value="">Scegli la materia</option>';
    classSelect.innerHTML = '<option value="">Tutte le classi</option>';

    if (window.innerWidth < 600) {
      subjectSelect.innerHTML = '<option value="">Materia</option>';
      classSelect.innerHTML = '<option value="">Classe</option>';
    }

    const selectedSchool = schoolSelect.value;
    if (!selectedSchool) return;

    const filtered = data.filter((d) => d.school === selectedSchool);
    const subjects = [...new Set(filtered.map((d) => d.subject))].sort((a, b) =>
      (SUBJECT_LABELS[a] || a).localeCompare(SUBJECT_LABELS[b] || b, locale)
    );

    const classes = [...new Set(filtered.map((d) => d.class))];

    subjects.forEach((subject) => {
      const option = document.createElement("option");
      option.value = subject;
      option.textContent = SUBJECT_LABELS[subject] || subject;
      subjectSelect.appendChild(option);
    });

    classes.forEach((cls) => {
      const option = document.createElement("option");
      option.value = cls;
      option.textContent = selectedSchool === "preschool" ? CLASS_LABELS.preschool[cls] : CLASS_LABELS[cls];
      classSelect.appendChild(option);
    });

    filterAndDisplay();
  });

  subjectSelect.addEventListener("change", filterAndDisplay);
  classSelect.addEventListener("change", filterAndDisplay);
}

function filterAndDisplay() {
  const school = document.getElementById("schoolSelect").value;
  const subject = document.getElementById("subjectSelect").value;
  const cls = document.getElementById("classSelect").value;

  activitiesContainer.innerHTML = "";

  // Case: school selected but not subject
  if (school && !subject) {
    const filtered = allData.filter((d) => d.school === school && (!cls || d.class === cls));
    const subjects = [...new Set(filtered.map((d) => d.subject))].sort((a, b) =>
      (SUBJECT_LABELS[a] || a).localeCompare(SUBJECT_LABELS[b] || b, locale)
    );

    const grid = document.createElement("div");
    //add class
    grid.classList.add("grid");
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "repeat(auto-fit, minmax(120px, 1fr))";
    grid.style.gap = "20px";
    grid.style.marginTop = "20px";

    subjects.forEach((subject) => {
      const activityCount = filtered
        .filter((entry) => entry.subject === subject)
        .reduce((sum, entry) => sum + (entry.topics?.length || 0), 0);

      const card = document.createElement("div");
      card.style.textAlign = "center";
      card.style.cursor = "pointer";

      card.classList.add("subject-card");

      card.innerHTML = `
  <div class="image-wrapper" title="${activityCount} attività in ${SUBJECT_LABELS[subject] || subject}">
    <img src="./images/subjects/site_subject_${subject}.png"
         alt="${SUBJECT_LABELS[subject]}"
         onerror="this.src='./images/subjects/site_subject_default.png'" />
    ${activityCount > 0 ? `<span class="badge">${activityCount}</span>` : ""}
  </div>
  <div class="label">${SUBJECT_LABELS[subject] || subject}</div>
`;

      card.addEventListener("click", () => {
        if (hideTop) backButton.style.display = "block";
        document.getElementById("subjectSelect").value = subject;
        document.getElementById("subjectSelect").dispatchEvent(new Event("change"));
      });

      grid.appendChild(card);
    });

    activitiesContainer.appendChild(grid);
    return;
  }

  // Case: school and subject selected, class optional
  if (school && subject) {
    const filtered = allData
      .filter((entry) => entry.school === school && entry.subject === subject && (!cls || entry.class === cls))
      .sort((a, b) => parseInt(a.class) - parseInt(b.class)); // order by class

    filtered.forEach((entry) => {
      const { school, subject, class: classNum, topics } = entry;
      topics.forEach((topic) => addTopic(topic, school, subject, classNum));
    });
  }
}

function goBack() {
  document.getElementById("subjectSelect").value = "";
  document.getElementById("classSelect").value = "";
  filterAndDisplay();
  backButton.style.display = "none";
}

function addTopic(topic, school, subject, classNum) {
  const topicDiv = document.createElement("div");
  topicDiv.classList.add("item");

  topicDiv.setAttribute("data-school", school);
  topicDiv.setAttribute("data-subject", subject);
  topicDiv.setAttribute("data-class", classNum);

  let detailsHTML = `<details><summary>${t("parameters")}</summary><ul>`;
  detailsHTML += `<li><h>Competenze:</h><ul>${(topic.competencies || []).map((c) => `<li>${c}</li>`).join("")}</ul></li>`;
  detailsHTML += `<li><h>Obiettivi:</h><ul>${(topic.objectives || []).map((o) => `<li>${o}</li>`).join("")}</ul></li>`;
  detailsHTML += `</ul></details>`;

  const classLabel = school === "preschool" ? CLASS_LABELS.preschool[classNum] : CLASS_LABELS[classNum];
  const schoolLabel = SCHOOL_LABELS[school] || school;
  const subjectLabel = SUBJECT_LABELS[subject] || subject;

  topicDiv.innerHTML = `
    <div class="image"></div>
    <div class="info">
      <h3>${topic.title}</h3>
      <span>${schoolLabel} - ${classLabel} - ${subjectLabel}</span>
      <p>${topic.description}</p>
      ${detailsHTML}
    </div>
  `;

  activitiesContainer.appendChild(topicDiv);
}

function disableRightClick() {
  document.addEventListener("contextmenu", (e) => e.preventDefault());
}

function getUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("l")) locale = urlParams.get("l");
  if (urlParams.has("i")) incorporatedSite = true;
  if (urlParams.has("s")) selectedSchool = urlParams.get("s");
  if (urlParams.has("ht")) hideTop = true;
}

function printWithParameters(value) {
  if (value) {
    document.getElementById("mainBody").classList.add("printWithParameters");
    document.querySelectorAll("details").forEach((details) => {
      details.setAttribute("open", "");
    });
  } else {
    document.getElementById("mainBody").classList.remove("printWithParameters");
    document.querySelectorAll("details").forEach((details) => {
      details.removeAttribute("open");
    });
  }

  setTimeout(() => {
    window.onafterprint = function () {
      document.getElementById("mainBody").classList.remove("printWithParameters");
      document.querySelectorAll("details").forEach((details) => {
        details.removeAttribute("open");
      });
    };
    window.print();
  }, 500);
}

function t(key) {
  const dictionary = {
    activitiesTitle: {
      en: "Available topics in",
      it: "Argomenti disponibili in",
    },
    activitiesDescription: {
      en: "The proposed topics are inspired by the latest <h><a href='https://www.mim.gov.it/documents/20182/0/Nuove+indicazioni+2025.pdf' target='blank'>National Guidelines of the Ministry of Education</a></h>. <br/>Select the <h>school level</h>, the <h>subject</h> and the <h>class</h> to view the contents you will find in the platform.",
      it: "Gli argomenti proposti di seguito sono ispirati alle ultime <h><a href='https://www.mim.gov.it/documents/20182/0/Nuove+indicazioni+2025.pdf' target='blank'>Indicazioni nazionali del Ministero dell'Istruzione</a></h>. <br/>Seleziona il <h>livello scolastico</h>, la <h>materia</h> e la <h>classe</h> per visualizzare i contenuti che troverai nella piattaforma.",
    },
    parameters: {
      en: "Objectives & Competencies",
      it: "Obiettivi e Competenze",
    },
  };
  return (dictionary[key] && dictionary[key][locale]) || key;
}
