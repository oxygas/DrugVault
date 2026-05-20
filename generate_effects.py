"""
Fetch subjective effects from PsychonautWiki MediaWiki API for all substances.
Categorizes effects into positives/negatives based on pharmacological convention.
Generates why-descriptions per category with substance-specific overrides.
Saves to src/data/subjective-effects.json.
"""
import json, time, urllib.request, urllib.parse, ssl, sys, os, re

DATA_PATH = "src/data/all-data.json"
OUT_PATH = "src/data/subjective-effects.json"
API_BASE = "https://psychonautwiki.org/w/api.php"
DELAY = 1.0
ctx = ssl.create_default_context()

# Effects classification: positive (sought) vs negative (undesired)
# Based on PsychonautWiki effect descriptions and pharmacological convention
POSITIVE_EFFECTS = {
    "Cognitive euphoria", "Physical euphoria", "Euphoria",
    "Anxiety suppression", "Depression reduction", "Stress suppression",
    "Pain relief", "Muscle relaxation", "Sedation",
    "Creativity enhancement", "Analysis enhancement", "Focus intensification",
    "Motivation enhancement", "Energy enhancement", "Stamina intensification",
    "Stimulation", "Wakefulness", "Reinvigoration", "Rejuvenation",
    "Empathy, affection and sociability enhancement", "Disinhibition",
    "Increased libido", "Cognitive euphoria", "Laughter fits",
    "Increased music appreciation", "Increased sense of humor",
    "Novelty enhancement", "Spirituality intensification",
    "Existential self-realization", "Unity and interconnectedness",
    "Personal meaning intensification", "Emotion intensification",
    "Catharsis", "Mindfulness", "Dream potentiation",
    "Appetite intensification", "Appetite suppression",
    "Color enhancement", "Color shifting", "Pattern recognition enhancement",
    "Visual acuity enhancement", "Auditory acuity enhancement",
    "Tactile intensification", "Gustatory intensification",
    "Visual processing acceleration", "Immersion intensification",
    "Thought connectivity", "Thought acceleration", "Thought organization",
    "Conceptual thinking", "Multiple thought streams",
    "Increased introspection", "Suggestibility suppression",
    "Memory enhancement", "Memory formation enhancement", "Neurogenesis",
    "Neuroplasticity", "Bodily control enhancement",
    "Physical autonomy", "Perception of bodily lightness",
    "Brightness alteration", "Synaesthesia",
    "Spontaneous bodily sensations", "Suggestibility intensification",
    "Increased salivation", "Bronchodilation", "Cough suppression",
    "Nausea suppression", "Seizure suppression", "Mouth numbing",
    "After images", "Tracers", "Geometry", "Color replacement",
    "Color tinting", "Depth perception distortions",
    "Environmental patterning", "Pattern recognition enhancement",
    "Auditory distortion", "Auditory hallucination",
    "Internal hallucination", "External hallucination",
    "Autonomous entity", "Machinescapes", "Magnification",
    "Scenery slicing", "Recursion", "Symmetrical texture repetition",
    "Transformations", "Settings, sceneries, and landscapes",
    "Scenarios and plots", "Perspective hallucination",
    "Drifting", "Diffraction", "Vibrating vision",
    "Environmental cubism", "Environmental orbism",
    "Optical sliding", "Visual acuity enhancement",
    "8A Geometry - Perceived exposure to semantic concept network",
    "8B Geometry - Perceived exposure to inner mechanics of consciousness",
    "Perceived exposure to inner mechanics of consciousness",
    "Perception of self-design", "Perception of eternalism",
    "Thought connectivity", "Personal bias suppression",
    "Ego replacement", "Identity alteration",
    "Dream potentiation", "Changes in felt bodily form",
    "Autonomous voice communication",
    "Olfactory hallucination", "Gustatory hallucination",
    "Tactile hallucination", "Déjà vu",
    "Addiction suppression", "Simultaneous emotions",
    "Perspective distortion", "Time distortion",
    "Vasodilation", "Decreased blood pressure",
    "Decreased heart rate", "Peripheral information misinterpretation",
    "Cognitive disconnection", "Physical disconnection",
    "Visual disconnection", "Delusion",
    "Depersonalization", "Derealization",
    "Near-death experience", "Sleep paralysis",
    "Dream suppression", "Language depression",
}

NEGATIVE_EFFECTS = {
    "Anxiety", "Paranoia", "Confusion", "Delirium", "Psychosis",
    "Nausea", "Vomiting", "Dehydration", "Headache", "Dizziness",
    "Constipation", "Difficulty urinating", "Frequent urination",
    "Respiratory depression", "Increased blood pressure",
    "Increased heart rate", "Increased bodily temperature",
    "Increased perspiration", "Vasoconstriction",
    "Muscle contractions", "Muscle twitching", "Teeth grinding",
    "Seizure", "Temperature regulation suppression", "Pupil dilation",
    "Pupil constriction", "Dry mouth", "Itchiness", "Skin flushing",
    "Runny nose", "Watery eyes", "Red eye", "Ringing in ears", "Tinnitus",
    "Excessive yawning", "Abnormal heartbeat",
    "Temporary erectile dysfunction", "Orgasm depression",
    "Decreased libido", "Body odor alteration", "Bowel movements",
    "Memory suppression", "Thought deceleration", "Thought disorganization",
    "Thought loop", "Analysis depression", "Analysis suppression",
    "Creativity depression", "Focus suppression", "Motivation depression",
    "Cognitive fatigue", "Physical fatigue", "Sleepiness",
    "Motor control loss", "Spatial disorientation",
    "Double vision", "Visual haze", "Visual processing deceleration",
    "Visual acuity suppression", "Auditory acuity suppression",
    "Tactile suppression", "Irritability",
    "Depression", "Suicidal ideation", "Mania",
    "Feelings of impending doom", "Delirium tremens",
    "Bodily pressures", "Perception of bodily heaviness",
    "Neurotoxicity", "Brain zaps", "Amnesia",
    "Compulsive redosing", "Enhancement and suppression cycles",
    "Pupil dilation", "Vasoconstriction",
    "Mouth numbing", "Dosage independent intensity",
}


def fetch_json(url, retries=3):
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "DrugVault/1.0 (data enrichment)"})
            with urllib.request.urlopen(req, timeout=20, context=ctx) as r:
                return json.loads(r.read())
        except Exception as e:
            if attempt < retries - 1:
                time.sleep((attempt + 1) * 3)
            else:
                return None
    return None


def get_pw_effects(name):
    subject = urllib.parse.quote(name.replace(" ", "_"))
    url = f"{API_BASE}?action=browsebysubject&subject={subject}&format=json"
    data = fetch_json(url)
    if not data or "query" not in data:
        return None

    effects_raw = []
    GENERIC_EFFECTS = {
        "Physical effect", "Cognitive effect", "Visual distortion effect",
        "Visual acuity effect", "Auditory effect", "Tactile effect",
        "Olfactory effect", "Gustatory effect", "Multisensory effect",
        "Transpersonal effect", "Hallucinatory states", "Undesirable effect",
        "Sensory effect", "Psychological effect", "Physical effects",
        "Cognitive effects", "Visual effects", "Auditory effects",
    }
    for prop in data["query"]["data"]:
        if prop["property"] == "Effect":
            for item in prop["dataitem"]:
                raw = item["item"]
                clean = re.sub(r"#\d+##$", "", raw).replace("_", " ")
                clean = clean.replace(", ", ",")  # PW uses underscores for commas in some
                if clean in GENERIC_EFFECTS:
                    continue
                effects_raw.append(clean)
            break

    if not effects_raw:
        return None

    summary = None
    for prop in data["query"]["data"]:
        if prop["property"] == "Summary":
            for item in prop["dataitem"]:
                s = item.get("item", "")
                if s and len(s) > 10:
                    summary = s
            break

    positives = [e for e in effects_raw if e in POSITIVE_EFFECTS]
    negatives = [e for e in effects_raw if e in NEGATIVE_EFFECTS]

    unclassified = [e for e in effects_raw if e not in POSITIVE_EFFECTS and e not in NEGATIVE_EFFECTS]
    for e in unclassified:
        negatives.append(e)

    return {
        "positives": positives,
        "negatives": negatives,
        "summary": summary or "",
    }


CATEGORY_WHY = {
    "Psychedelics": "Users seek psychedelic experiences for self-exploration, spiritual growth, creative breakthroughs, and the profound sense of wonder and interconnectedness these substances produce. Many report lasting positive changes in perspective after use.",
    "Depressants": "Users take depressants primarily for anxiety relief, sleep aid, and the comforting sense of calm and emotional detachment they provide. The appeal lies in escaping negative emotions and achieving relaxed disinhibition.",
    "Stimulants": "Users seek stimulants for productivity enhancement, social energy, and the confident euphoric rush they provide. The drive to maintain the high and avoid the comedown often leads to compulsive redosing cycles.",
    "Opioids": "Users initially take opioids for pain relief or the unmatched euphoria they produce — often described as a warm blanket over all emotional and physical pain. The combination of euphoria and anxiolysis makes them extremely reinforcing.",
    "Entactogens": "Users take entactogens for the unique combination of euphoria and emotional openness — they facilitate deep connections and communication that users find transformative. The empathogenic effects are sought for social bonding and the feeling of universal love.",
    "Dissociatives": "Users seek dissociatives for the escape from physical reality, the unique hole experience of complete detachment, and the psychedelic-like philosophical insights. The ability to disconnect from pain makes them both recreationally and medicinally appealing.",
    "Cannabinoids": "Users seek cannabinoids for relaxation, sensory enhancement, creative stimulation, and relief from anxiety, pain, or insomnia. The relatively mild effects and low acute toxicity make them widely popular.",
    "Inhalants": "Users (disproportionately young) inhale volatile substances primarily because they are cheap and accessible. The extremely short duration and intense toxicity make them among the most harmful recreational substances.",
    "Deliriants": "Most users try deliriants once out of curiosity. The experience is almost universally negative — terrifying and confusing — and very few users repeat it. The drug community actively discourages recreational use.",
    "Nootropics": "Users take nootropics for cognitive enhancement — better focus, improved memory, and competitive mental performance. The appeal is in safely optimizing brain function without the risks of traditional stimulants.",
    "Antidepressants": "Users take antidepressants under medical supervision to treat clinical depression and anxiety disorders. They are not typically used recreationally — the primary motivation is symptom relief and functional recovery.",
    "Supplements": "Users take supplements as gentler alternatives to pharmaceuticals — for mild anxiety relief, sleep support, or as adjuncts. The appeal is in natural, low-risk approaches with minimal side effects.",
    "Gabapentionoids": "Users seek gabapentionoids for anxiety relief and the mild euphoria they produce — often as alternatives to benzodiazepines. Dependence potential is often underestimated, especially with daily use.",
}

SUBSTANCE_WHY = {
    "lsd": "LSD is sought for its legendary ability to dissolve ego boundaries and produce mystical, transformative experiences lasting 8-12 hours. Users report profound shifts in worldview and creativity that can persist long after the trip ends.",
    "psilocybin": "Psilocybin is sought for emotional healing, spiritual exploration, and the naturalistic visionary state it produces. Clinical research has validated its rapid antidepressant effects, making it increasingly popular for both recreational and therapeutic use.",
    "dmt": "DMT users seek the breakthrough — an intensely vivid, otherworldly experience compressed into 10-15 minutes that feels more real than reality itself. The brevity and intensity make it unique among psychedelics.",
    "mdma": "MDMA is sought for the unique combination of euphoria and emotional openness — users describe feeling genuine love and connection with everyone around them. The empathogenic quality makes it transformative for therapy and social bonding, though the magic fades with repeated use.",
    "ketamine": "Ketamine is sought for both the recreational k-hole experience and its remarkable rapid-acting antidepressant properties. Users value the short duration, unique dissociative effects, and growing clinical validation for treatment-resistant depression.",
    "heroin": "Heroin users seek the legendary rush — an intense wave of warmth and euphoria that eliminates all physical and emotional pain. The reinforcing quality is so powerful that most users cannot imagine life without it once dependent.",
    "cocaine": "Cocaine is sought for the brief but intense euphoric rush and social confidence it provides. The short duration and high cost create a destructive cycle of craving and redosing.",
    "methamphetamine": "Methamphetamine users seek the unmatched euphoric rush and extreme energy it provides. The drug creates a powerful reward signal that makes normal life feel unbearable by comparison, driving compulsive use.",
    "cannabis": "Cannabis is sought for its versatile combination of relaxation, sensory enhancement, and mild euphoria. It serves simultaneously as a social lubricant, creative aid, sleep remedy, and pain reliever.",
    "alcohol": "Alcohol is used for social lubrication, stress relief, and the mild euphoric relaxation it provides. Its legal status and cultural acceptance make it the most commonly used psychoactive substance globally, despite being among the most harmful.",
    "salvinorin a": "Salvinorin A users seek the intensely unique, otherworldly experiences produced through its novel kappa-opioid mechanism. The brevity and non-toxicity make it physically safe, but the extreme intensity means most users try it only a few times.",
    "ibogaine": "Ibogaine is sought primarily as a radical treatment for addiction — many users report that a single session eliminates opioid withdrawal and cravings for extended periods.",
    "kratom": "Kratom users seek the dual stimulant/opioid effects — energy at low doses, pain relief and relaxation at higher doses. It's particularly popular as a self-managed alternative to prescription opioids.",
    "nitrous oxide": "Nitrous oxide users seek the brief but intense dissociative rush and euphoria. Its medical legitimacy and short duration make it seem safer than other inhalants, though chronic use carries serious neurological risks.",
    "datura": "Datura is almost never sought recreationally — most who try it do so once out of morbid curiosity and never repeat it. The experience is genuine delirium, not a trip. The drug community universally warns against it.",
    "ghb": "GHB users seek the unique combination of euphoria, sociability, and relaxation — often describing it as a cleaner, shorter alcohol alternative. The extremely narrow dose window makes it one of the easiest substances to accidentally overdose on.",
    "pcp": "PCP users seek the intense dissociative state and sense of detachment from reality. The feelings of invulnerability and power can be compelling but also lead to dangerous situations. It is among the most unpredictable dissociatives.",
    "adderall": "Adderall users seek it primarily for focus and productivity enhancement. The clean, functional stimulation makes it the most socially accepted stimulant, though non-medical dependence is common.",
    "fentanyl": "Fentanyl is rarely sought recreationally — most exposure is through contamination of other drugs. Its extreme potency makes it profitable for illicit manufacturers but catastrophically dangerous for end users.",
    "mephedrone": "Mephedrone users seek the uniquely powerful combination of stimulant euphoria and empathogenic warmth. The intense but short-lived effects create a strong redosing compulsion prone to binging.",
    "phenibut": "Phenibut users seek the functional anxiolysis and social confidence it provides — often describing it as a cleaner alternative to alcohol or benzodiazepines. The insidious withdrawal syndrome makes it one of the most commonly underestimated substances.",
    "dxm": "DXM is primarily used by young people due to its OTC availability, seeking the unique dose-dependent effects that range from mild euphoria to full dissociative experiences.",
    "mescaline": "Mescaline is valued for its gentle, earthy quality and deep cultural roots in indigenous spiritual practice. Users seek the long, warm, nature-connected visionary state.",
    "2c-b": "2C-B is sought for its unique position between psychedelics and entactogens — offering visual beauty and emotional warmth without the overwhelming introspection of heavier psychedelics.",
}


def main():
    with open(DATA_PATH) as f:
        data = json.load(f)

    if os.path.exists(OUT_PATH):
        with open(OUT_PATH) as f:
            effects = json.load(f)
    else:
        effects = {}

    # Filter out old format entries (list-based from Reddit attempt)
    effects = {k: v for k, v in effects.items() if isinstance(v, dict) and "positives" in v}

    remaining = [s for s in data["s"] if s["n"].lower() not in effects or not effects[s["n"].lower()].get("positives")]
    # Also re-fetch entries with empty effects lists (need re-scrape)
    print(f"Existing: {len(effects)}, Remaining: {len(remaining)}")

    found = 0
    not_found = 0

    for i, s in enumerate(remaining):
        name = s["n"]
        aliases = s.get("a", [])
        category = s["c"]

        sys.stdout.write(f"[{i+1}/{len(remaining)}] {name}")
        sys.stdout.flush()

        # Try substance name, then aliases
        pw_data = get_pw_effects(name)
        tried = [name]
        if not pw_data or (not pw_data["positives"] and not pw_data["negatives"]):
            for alias in aliases[:3]:
                pw_data = get_pw_effects(alias)
                tried.append(alias)
                if pw_data and (pw_data["positives"] or pw_data["negatives"]):
                    break

        if pw_data and (pw_data["positives"] or pw_data["negatives"]):
            key = name.lower()
            why = SUBSTANCE_WHY.get(key, CATEGORY_WHY.get(category, ""))

            effects[key] = {
                "positives": pw_data["positives"],
                "negatives": pw_data["negatives"],
                "why": why,
            }
            found += 1
            sys.stdout.write(f" ({len(pw_data['positives'])}+ / {len(pw_data['negatives'])}- via {tried[-1]})")
        else:
            # Fallback: use category template
            key = name.lower()
            cat_why = CATEGORY_WHY.get(category, "")
            effects[key] = {
                "positives": [],
                "negatives": [],
                "why": cat_why,
            }
            not_found += 1
            sys.stdout.write(f" (fallback to category)")

        sys.stdout.write("\n")
        sys.stdout.flush()

        # Save every 10
        if (i + 1) % 10 == 0 or i == len(remaining) - 1:
            with open(OUT_PATH, "w") as f:
                json.dump(effects, f, ensure_ascii=False, indent=2)

        time.sleep(DELAY)

    # Final save
    with open(OUT_PATH, "w") as f:
        json.dump(effects, f, ensure_ascii=False, indent=2)

    pw_count = sum(1 for v in effects.values() if v.get("positives") or v.get("negatives"))
    print(f"\n=== Done. {len(effects)} total, {pw_count} with PW effects, {len(effects) - pw_count} category fallback")


if __name__ == "__main__":
    main()
