
export interface Config {
  org?: {
    /** configuration for Azure */
    gcp?: {
      jobs?: {
        retrieveProjects?: boolean;
      }
    }
  };
}
