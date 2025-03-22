import os
import json
import urllib.parse
import requests
from time import sleep
from concurrent.futures import ThreadPoolExecutor, as_completed

# === CONFIGURAZIONE ===
SCHOOL_LEVELS = ["primary", "secondary", "preschool"]
CLASSES = {
    "preschool": ["3", "4", "5"],
    "primary": ["1", "2", "3", "4", "5"],
    "secondary": ["1", "2", "3"]
}

# Suddivisione per ordine scolastico
SUBJECTS_BY_LEVEL = {
    "preschool": [
        "selfAndOthers",           # Il sé e l'altro
        "bodyAndMovement",         # Il corpo e il movimento
        "imagesSoundsColors",      # Immagini, suoni, colori
        "speechAndWords",          # I discorsi e le parole
        "worldExploration"          # La conoscenza del mondo
    ],
    "primary": [
        "italian",
        "english",
        "history",
        "geography",
        "math",
        "science",
        "music",
        "art",
        "physical",
        "technology",
        "civic",
        "religion"
    ],
    "secondary": [
        "italian",
        "english",
        "french",
        "spanish", 
        "german",
        "history",
        "geography",
        "math",
        "science",
        "music",
        "art",
        "physical",
        "technology",
        "civic",
        "religion"
    ]
}


OUTPUT_DIR = "./json/"
os.makedirs(OUTPUT_DIR, exist_ok=True)

MODEL_NAME = "gpt-4o-2024-05-13"
ENDPOINT = "http://localhost:60000/query"
MAX_WORKERS = 2  # 🔁 Numero massimo di richieste in parallelo
OVERWRITE = False  # ⛔ Cambia in True se vuoi forzare la rigenerazione dei file

# === PROMPT TEMPLATE ===
PROMPT_TEMPLATE = """Agisci come un esperto di didattica della scuola italiana.

Devi generare un elenco dettagliato di almeno 20 argomenti per ogni combinazione di scuola {school_level}, classe {class_num}, materia {subject}.

Ogni argomento deve essere:
- pertinente al livello scolastico
- in ordine temporale di insegnamento durante l’anno scolastico
- pensato secondo la progressione didattica della materia per quella classe

Per ogni argomento, fornisci:
1. title: titolo dell’argomento
2. description: descrizione dell’argomento
3. competencies: 2-3 competenze attese
4. objectives: 2-3 obiettivi specifici di apprendimento

Restituisci un JSON valido nella seguente struttura:

{{
  "school": "{school_level}",
  "subject": "{subject}",
  "class": "{class_num}",
  "topics": [
    {{
      "title": "...",
      "description": "...",
      "competencies": ["...", "..."],
      "objectives": ["...", "..."]
    }}
  ]
}}

❗ Usa solo italiano corretto e didatticamente adeguato.
❗ Non includere testo extra. Rispondi solo con il JSON strutturato.
"""

def build_request_url(prompt, model_name, user_message):
    params = {
        "s": prompt,
        "m": user_message,
        "mn": model_name
    }
    return f"{ENDPOINT}?{urllib.parse.urlencode(params)}"

def generate_and_save(school_level, subject, class_num):
    prompt = PROMPT_TEMPLATE.format(
        school_level=school_level,
        subject=subject,
        class_num=class_num
    )
    url = build_request_url(prompt, MODEL_NAME, "")

    filename = f"{school_level}_{subject}_{class_num}.json"
    filepath = os.path.join(OUTPUT_DIR, filename)

    if os.path.exists(filepath) and not OVERWRITE:
        print(f"⏩ File già esistente, salto: {filename}")
        return

    print(f"🔄 Generating: {filename}")
    try:
        response = requests.get(url, timeout=120)
        response.raise_for_status()

        outer = response.json()

        if "response" not in outer:
            raise ValueError("❌ Campo 'response' mancante nella risposta")

        inner = json.loads(outer["response"])

        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(inner, f, ensure_ascii=False, indent=2)

        print(f"✅ Salvato: {filename}")
    except Exception as e:
        print(f"❌ Errore per {filename}: {e}")

def main():
    tasks = []

    for school in SCHOOL_LEVELS:
        subjects = SUBJECTS_BY_LEVEL[school]
        for subject in subjects:
            for class_num in CLASSES[school]:
                tasks.append((school, subject, class_num))

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        future_to_task = {
            executor.submit(generate_and_save, school, subject, class_num): (school, subject, class_num)
            for school, subject, class_num in tasks
        }

        for future in as_completed(future_to_task):
            task = future_to_task[future]
            try:
                future.result()
            except Exception as exc:
                print(f"❌ Errore in {task}: {exc}")

def merge_all_json():
    print("🔄 Unione di tutti i file JSON...")
    merged = []
    for filename in os.listdir(OUTPUT_DIR):
        if not filename.endswith(".json") or filename == "all.json":
            continue
        filepath = os.path.join(OUTPUT_DIR, filename)
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                content = json.load(f)
                merged.append(content)
        except Exception as e:
            print(f"⚠️ Errore durante la lettura di {filename}: {e}")

    # Salvataggio minificato
    output_path = os.path.join("topics", "data", "all.json")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as out:
        json.dump(merged, out, ensure_ascii=False, separators=(",", ":"))
    print(f"✅ File unificato salvato in {output_path}")


if __name__ == "__main__":
    main()
    merge_all_json()
