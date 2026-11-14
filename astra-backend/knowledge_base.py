KNOWLEDGE_BASE = [
    {
        'id': 'kb-001',
        'title': 'Resting Heart Rate in Spaceflight',
        'content': (
            "During spaceflight, resting heart rate may change due to fluid shifts, "
            "cardiovascular deconditioning, and altered autonomic regulation. A gradual "
            "increase in resting heart rate over several days can indicate reduced physical "
            "conditioning or elevated stress. Individual baselines matter more than population "
            "averages because each astronaut responds differently to the space environment."
        ),
        'sources': ['NASA Human Research Roadmap', 'NASA CIPHER'],
        'tags': ['heart_rate', 'cardiovascular', 'baseline'],
    },
    {
        'id': 'kb-002',
        'title': 'Heart Rate Variability',
        'content': (
            "Heart rate variability (HRV) reflects autonomic nervous system function. Reduced HRV "
            "can be associated with stress, fatigue, and overtraining. In the space environment, "
            "HRV trends should be interpreted alongside sleep and activity data for a fuller picture."
        ),
        'sources': ['NASA Human Research Program', 'NASA CIPHER'],
        'tags': ['hrv', 'stress', 'fatigue'],
    },
    {
        'id': 'kb-003',
        'title': 'Sleep in Space',
        'content': (
            "Sleep duration and quality are commonly affected during space missions due to "
            "circadian disruption, workload, and environmental factors. A sustained decrease in "
            "sleep duration, particularly when combined with changes in heart rate or fatigue "
            "reports, may indicate accumulating fatigue that deserves attention."
        ),
        'sources': ['NASA Human Research Roadmap', 'NASA OSDR behavioral studies'],
        'tags': ['sleep', 'fatigue', 'circadian'],
    },
    {
        'id': 'kb-004',
        'title': 'Exercise Recovery',
        'content': (
            "Exercise recovery time is a useful indicator of physical conditioning and fatigue. "
            "Prolonged recovery after exercise, especially when resting heart rate is also elevated "
            "and sleep is reduced, can signal that the astronaut's physical workload should be "
            "reviewed."
        ),
        'sources': ['NASA CIPHER', 'NASA Human Research Program'],
        'tags': ['exercise_recovery', 'fatigue', 'activity'],
    },
    {
        'id': 'kb-005',
        'title': 'Blood Oxygen Saturation',
        'content': (
            "Blood oxygen saturation (SpO2) is typically maintained within a narrow range in healthy "
            "individuals. Values below the normal range should be evaluated in context. In space, "
            "SpO2 changes are usually modest but should be reviewed when combined with other "
            "respiratory or cardiovascular indicators."
        ),
        'sources': ['NASA Human Research Roadmap'],
        'tags': ['blood_oxygen', 'respiratory', 'cardiovascular'],
    },
    {
        'id': 'kb-006',
        'title': 'Body Temperature',
        'content': (
            "Core body temperature is tightly regulated. Small variations can occur with activity, "
            "circadian rhythm, and environmental conditions. Persistent deviations from an "
            "astronaut's personal baseline may deserve monitoring, particularly when accompanied "
            "by other symptoms."
        ),
        'sources': ['NASA OSDR physiological studies'],
        'tags': ['body_temp', 'physiological'],
    },
    {
        'id': 'kb-007',
        'title': 'Radiation Exposure Monitoring',
        'content': (
            "Radiation exposure is an environmental risk factor in space missions. It is tracked "
            "as cumulative dose over time rather than as an immediate health indicator. Radiation "
            "readings provide environmental context and should be considered alongside physiological "
            "data, but they are not used to predict acute illness."
        ),
        'sources': ['NASA Human Research Roadmap', 'NASA OSDR environmental data'],
        'tags': ['radiation', 'environment', 'cumulative'],
    },
    {
        'id': 'kb-008',
        'title': 'Behavioral Health and Performance',
        'content': (
            "Behavioral wellness indicators such as mood, stress self-assessment, sleep quality, and "
            "cognitive performance (for example, reaction time) are important parts of astronaut "
            "health monitoring. Trends in these indicators can reveal accumulating fatigue or stress "
            "even when physiological measurements appear stable."
        ),
        'sources': ['NASA Human Research Roadmap', 'NASA CIPHER behavioral adaptation'],
        'tags': ['mood', 'stress', 'cognitive', 'behavioral'],
    },
    {
        'id': 'kb-009',
        'title': 'Multi-Signal Anomaly Detection',
        'content': (
            "Looking at multiple health indicators together is more informative than checking each one "
            "in isolation. A small change in several measurements at the same time can be more "
            "meaningful than a single large change. Personalized baselines make it possible to "
            "distinguish an astronaut's normal pattern from a genuinely unusual shift."
        ),
        'sources': ['ASTRA internal methodology', 'NASA OSDR research methodology'],
        'tags': ['anomaly', 'multi-signal', 'baseline'],
    },
    {
        'id': 'kb-010',
        'title': 'When to Escalate',
        'content': (
            "An anomaly score reflects how unusual a pattern is compared with the personal baseline. "
            "It does not, by itself, predict illness. Critical-severity alerts and recurring watch-level "
            "patterns should be reviewed by qualified medical support. Astronauts should follow "
            "approved medical protocols and report concerning symptoms promptly."
        ),
        'sources': ['NASA Human Research Program', 'ASTRA medical protocol'],
        'tags': ['escalation', 'protocol', 'alert'],
    },
]


def retrieve_relevant(query, top_n=4):
    query_lower = query.lower()
    scored = []
    for doc in KNOWLEDGE_BASE:
        score = 0
        for tag in doc['tags']:
            if tag in query_lower:
                score += 3
        content_lower = doc['content'].lower()
        for word in query_lower.split():
            if len(word) > 3 and word in content_lower:
                score += 1
        if score > 0:
            scored.append((score, doc))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [doc for _, doc in scored[:top_n]] if scored else KNOWLEDGE_BASE[:top_n]


def format_answer(query, docs):
    if not docs:
        return "I don't have specific information on that topic yet. Try rephrasing your question.", []
    context = ""
    for doc in docs:
        context += f"\n--- {doc['title']} ---\n{doc['content']}\n(Source: {', '.join(doc['sources'])})\n"
    answer = (
        f"Based on the available knowledge base, here is what we know:\n\n"
        f"{context}\n"
        f"Note: This information is for reference only and is not a medical diagnosis. "
        f"If you have a concerning symptom, follow approved medical protocols and contact qualified medical support."
    )
    return answer, [doc['title'] for doc in docs]
