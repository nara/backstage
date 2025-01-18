
// @ts-check

/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  return (
    knex.schema
      .createTable('csp_resources', table => {
        table.comment(
          'Table to store cloud clusters information',
        );
        table
          .string('resourceId', 500)
          .primary()
          .notNullable()
          .comment('Unique Id for resource CSP specific');
        table
          .string('resourceType', 50).nullable()
          .notNullable()
          .comment('Type of the resource');
        table
          .string('resourceName', 500).nullable()
          .comment('Name of the resource');
        table
          .string('resource_detail_id', 500).nullable()
          .comment('more detailed id for resource');
        table.integer('csp_type_id').references('id').inTable('csp_types').notNullable();
        table.string('csp_account_id').references('id').inTable('csp_accounts').notNullable();
        table.string('region', 500).nullable();
        table.json('data').nullable();
        table.timestamp('createdAt').defaultTo( knex.fn.now() );
        table.timestamp('updatedAt');
      })
  );
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  return knex.schema
    .dropTable('app_layers_schema');
};
