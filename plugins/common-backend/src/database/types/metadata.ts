export type DbPageInfo =
  | {
      hasNextPage: false;
    }
  | {
      hasNextPage: true;
      endCursor: string;
    };

export type DbLocationsRow = {
  id: string;
  type: string;
  target: string;
};

export type DbRefreshStateRow = {
  entity_id: string;
  entity_ref: string;
  unprocessed_entity: string;
  unprocessed_hash?: string;
  processed_entity?: string;
  result_hash?: string;
  cache?: string;
  next_update_at: string | Date;
  last_discovery_at: string | Date; // remove?
  errors?: string;
  location_key?: string;
};

export type DbRefreshStateReferencesRow = {
  source_key?: string;
  source_entity_ref?: string;
  target_entity_ref: string;
};

export type DbRelationsRow = {
  originating_entity_id: string;
  source_entity_ref: string;
  target_entity_ref: string;
  type: string;
};

export type DbFinalEntitiesRow = {
  entity_id: string;
  hash: string;
  stitch_ticket: string;
  final_entity?: string;
};

export type DbSearchRow = {
  entity_id: string;
  key: string;
  value: string | null;
};
