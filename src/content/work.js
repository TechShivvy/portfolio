// Single source of truth shared between the Work section and the
// interactive terminal's `cat work.txt`.

export const WORK = {
  evals: {
    label: "Agent Evals",
    icon: "[~]",
    blurb: "evaluation infrastructure for LLM agents - reproducible or it doesn't count",
    favorites: [
      "nightly eval pipelines on Databricks, run against real production transcripts",
      "traced intermittent 'no response' failures to a sync/async event-loop mismatch  // three systems away from where I started looking",
      "PEP 440 versioning off git describe, so every eval result maps back to an exact build",
      "multi-version docs built from git worktrees  // ~400 lines of orchestration nobody asked for",
    ],
  },
  platform: {
    label: "Platform",
    icon: "[#]",
    blurb: "keeping production up, and knowing the moment it isn't",
    favorites: [
      "graceful shutdown handling for Flask + Gunicorn  // zero dropped in-flight requests on deploy",
      "Kubernetes and ingress-controller upgrades, shadow-tested in staging before touching prod",
      "found and fixed a key-refresh bug that only showed up under specific worker concurrency",
      "autoscaling tuned and validated against cloned production traffic, not guesses",
    ],
  },
  data: {
    label: "Data",
    icon: "[=]",
    blurb: "pipelines that move a lot and drop nothing",
    favorites: [
      "telemetry pipeline in Scala on Spark/Databricks  // learned the stack on the job, shipped it anyway",
      "chased a data-quality bug down to character encoding at the database session layer",
      "row-level security via dynamic views instead of duplicating data per client",
    ],
  },
  mlops: {
    label: "MLOps",
    icon: "[>]",
    blurb: "getting models off a laptop and onto real hardware",
    favorites: [
      "distributed model serving on Ray  // moved off CPU-bottlenecked local inference",
      "wired monitoring straight into the serving path instead of bolting it on after",
      "automated multi-node deploys so scaling up wasn't a manual afternoon",
    ],
  },
  devops: {
    label: "DevOps",
    icon: "[$]",
    blurb: "the plumbing nobody thanks you for until it breaks",
    favorites: [
      "built a reusable distributed load-testing framework  // now used by more than one team",
      "purged ~100 leaked secrets from git history without breaking a single pipeline",
      "OIDC-based publishing to package registries  // no more static credentials sitting around",
    ],
  },
};

Object.freeze(WORK);

export default WORK;
