// @ts-check

/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  return (
    //
    // csp_types
    //
    knex.schema
      .createTable('csp_types', table => {
        table.integer('id').primary();
        table.string('csp', 255).notNullable();
        table.timestamp('createdAt').defaultTo( knex.fn.now() );
        table.timestamp('updatedAt');
      })
      //
      // csp_accounts
      //
      .createTable('csp_accounts', table => {
        table.comment(
          'Table to store cloud accounts, projects, subscriptions',
        );
        table
          .string('id', 500)
          .primary()
          .notNullable()
          .comment('Unique Id for account CSP specific');
        table.integer('csp_type_id').references('id').inTable('csp_types').notNullable();
        table.string('account_alias', 500).notNullable();
        table.string('account_status', 100).notNullable();
        table.string('account_desc', 500).notNullable();
        table.timestamp('createdAt').defaultTo( knex.fn.now() );
        table.timestamp('updatedAt');
      }).then(function () {
        return knex("csp_types").insert([
            {id: 1, csp: "AWS"},
            {id: 2, csp: "AZURE"},
            {id: 3, csp: "GCP"},
            {id: 4, csp: "ORACLE"},
        ]);
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
