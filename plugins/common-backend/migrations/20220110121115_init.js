
// @ts-check

/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  return (
    knex.schema
      .createTable('app_layers_schema', table => {
        table.increments('id').primary();
        table.string('appUniqueName', 255).notNullable();
        table.integer('layerIndex', 255).notNullable();
        table.jsonb('layerSchema').notNullable();
        table.string('schemaHashAtTask').nullable();
        table.string('taskId', 512).nullable();
        table.timestamp('createdAt').defaultTo( knex.fn.now() );
        table.timestamp('createdBy').nullable();
        table.timestamp('updatedAt').nullable();
        table.timestamp('updatedBy').nullable()
        table.unique(['appUniqueName', 'layerIndex']);
      }).raw('ALTER SEQUENCE app_layers_schema_id_seq RESTART WITH 1')
  );
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  return knex.schema
    .dropTable('app_layers_schema');
};
