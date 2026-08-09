const STACK = [
  { label: "languages", items: ["Python", "Scala", "TypeScript", "SQL", "Java", "C/C++"] },
  { label: "ml / llm", items: ["LLM Evals", "RAG", "Ray", "Google ADK", "MCP", "Time-series forecasting"] },
  { label: "data", items: ["Databricks", "Spark", "Kafka", "Snowflake", "Elasticsearch", "MySQL", "ClickHouse", "MilvusDB"] },
  { label: "infra", items: ["Kubernetes", "Docker", "AWS", "GCP", "GitHub Actions", "Concourse", "Vault", "Apigee", "Artifactory"] },
  { label: "observability", items: ["Prometheus", "Grafana", "OpenSearch", "Locust"] },
  { label: "backend", items: ["FastAPI", "Flask", "React", "Node", "REST APIs", "GraphQL", "Pydantic", "Streamlit"] },
];

Object.freeze(STACK);

export default STACK;
