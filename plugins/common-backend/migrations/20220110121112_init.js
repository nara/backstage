
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
      //
      // csp_vpc_subnets
      //
      .createTable('csp_vpcs', table => {
        table.comment(
          'Table to store cloud vpcs',
        );
        table
          .string('vpcId', 500)
          .primary()
          .notNullable()
          .comment('Unique Id for vpc CSP specific');
        table
          .string('vpc_detail_id', 500).nullable()
          .comment('more detailed id for vpc');
        table.integer('csp_type_id').references('id').inTable('csp_types').notNullable();
        table.string('csp_account_id').references('id').inTable('csp_accounts').notNullable();
        table.string('vpc_name', 100).notNullable();
        table.string('vpc_cidr', 500).notNullable();
        table.string('region', 500).nullable();
        table.json('data').nullable();
        table.timestamp('createdAt').defaultTo( knex.fn.now() );
        table.timestamp('updatedAt');
      })
      .createTable('csp_vpc_subnets', table => {
        table.comment(
          'Table to store cloud vpc, subnet info',
        );
        table
          .string('subnetId', 500)
          .primary()
          .notNullable()
          .comment('Unique Id for subnet CSP specific');
        table.integer('csp_type_id').references('id').inTable('csp_types').notNullable();
        table.string('vpc_id', 500).references('vpcId').inTable('csp_vpcs').notNullable();
        table.string('subnet_name', 500).notNullable();
        table.string('subnet_cidr', 500).notNullable();
        table.string('region', 500).notNullable();
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
    .dropTable('csp_accounts')
    .dropTable('csp_types');
};
