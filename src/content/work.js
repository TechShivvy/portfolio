// Single source of truth shared between the Work section and the
// interactive terminal's `cat work.txt`.

export const WORK = {
  platform: {
    label: "Platform & Reliability",
    icon: "[#]",
    blurb: "keeping production up, and knowing the moment it isn't",
    favorites: [
      "own production reliability for an ML video-processing service - dashboards, RCAs, and the pager when something breaks",
      "led a Kubernetes and ingress-controller upgrade, shadow-tested against real production conditions in staging first",
      "graceful shutdown handling for Flask + Gunicorn under SIGTERM  // zero dropped in-flight requests on deploy",
      "chased a key-refresh race condition across worker threads through 7+ candidate fixes before landing on a stable one",
      "moved distributed model serving off CPU-bottlenecked local inference onto Ray, then wired monitoring into the serving path",
      "tuned autoscaling and validated it against cloned production traffic, not guesses",
    ],
  },
  data: {
    label: "Data Engineering",
    icon: "[=]",
    blurb: "pipelines that move a lot and drop nothing",
    favorites: [
      "designed, built, and shipped a telemetry pipeline in Scala on Spark/Databricks end to end  // learned the stack on the job",
      "built an ingestion pipeline that pulls from a source system, strips PII at the source, and publishes clean datasets on a schedule",
      "traced a chunking pipeline's failures all the way back through the stack to a specific upstream file format, then fixed it",
      "chased a data-quality bug down to character encoding at the database session layer, across two different client libraries",
      "designed row-level access to shared data using dynamic views and group membership instead of duplicating data per client",
    ],
  },
  evals: {
    label: "Evals & Agents",
    icon: "[~]",
    blurb: "evaluation infrastructure for LLM agents - reproducible or it doesn't count",
    favorites: [
      "own the CI/CD, packaging, and versioning for an LLM-agent evaluation library, published to two different package registries",
      "built automated regression and production evaluation pipelines that run on a schedule against real traffic",
      "traced an intermittent 'no response' failure to a sync/async event-loop mismatch three systems away from where I started looking",
      "built a multi-version documentation system from scratch  // ~400 lines of orchestration nobody asked for, because the existing tooling couldn't keep up",
      "wired deployed-build tracking into the evaluation dashboard so a bad result always maps back to an exact commit",
    ],
  },
  automation: {
    label: "Automation",
    icon: "[$]",
    blurb: "the plumbing nobody thanks you for until it breaks",
    favorites: [
      "built a Slack bot wired to GitHub Actions that replaced a fully manual daily reporting process",
      "built the tooling behind a root-cause-analysis workflow - dynamic forms, an API endpoint, and the error handling to make it trustworthy",
      "built a reusable distributed load-testing framework  // now adopted by more than one team",
      "refactored a monolithic cost-reporting script into a modular, alerting-aware codebase",
    ],
  },
  security: {
    label: "Security & Auth",
    icon: "[%]",
    blurb: "closing gaps before someone else finds them",
    favorites: [
      "led a hardening effort so an authentication layer could no longer be silently disabled, rolled out across multiple environments",
      "validated a token-auth flow end to end - signatures, expiry, scope, and forged or malformed tokens",
      "purged roughly 100 leaked secrets out of git history without breaking a single pipeline",
      "migrated repositories and secret management across two different platforms with zero downtime",
    ],
  },
  ownership: {
    label: "Owned End-to-End",
    icon: "[*]",
    blurb: "the stuff with my name on it, not just a ticket",
    favorites: [
      "took full ownership of an internal AI-assistant bot for about four months, ramping up on a platform I'd never touched from zero",
      "own production reliability for an ML video-processing service, start to finish",
      "own an evaluation-pipelines repository - architecture, releases, and the on-call when a run fails",
      "picked up whatever surrounding infrastructure blocked my pipelines - IAM, service accounts, message queues - instead of waiting for someone else to own it",
    ],
  },
};

Object.freeze(WORK);

export default WORK;
