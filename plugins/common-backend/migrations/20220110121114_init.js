
// @ts-check

/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  return (
    knex.schema
      .alterTable('csp_accounts', table => {
        table.string('csp_orgunit_id').references('id').inTable('csp_orgunits').nullable();
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
