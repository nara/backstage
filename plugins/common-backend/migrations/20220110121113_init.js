
// @ts-check

/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  return (
    knex.schema
      .createTable('csp_orgunits', table => {
        table.comment(
          'Table to store org units or management groups or folders',
        );
        table
          .string('id', 500)
          .primary()
          .notNullable()
          .comment('Unique Id for org unit CSP specific');
        table
          .string('org_unit_id', 500).nullable()
          .comment('more detailed id for org unit');
        table.integer('csp_type_id').references('id').inTable('csp_types').notNullable();
        table.string('name', 100).notNullable();
        table.string('parent_org_unit_id', 500).nullable();
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
    .dropTable('csp_accounts')
    .dropTable('csp_types');
};
