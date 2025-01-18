
// @ts-check

/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  return (
    knex.schema
      .createTable('entity_jsons', table => {
        table.comment(
          'Table to store entity jsons',
        );
        table
          .string('id', 500)
          .primary()
          .notNullable()
          .comment('Unique Id for entity json');
        table
          .string('templateName', 100).nullable()
          .notNullable()
          .comment('Name of the template');
        table
          .string('componentId', 200).nullable()
          .notNullable()
          .comment('Id of the component');
        table
          .jsonb('entityJson').notNullable();
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
