//@ts-nocheck

/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
//     pgm.sql(`
//     CREATE TABLE jobs (
//       id SERIAL PRIMARY KEY,
//       title VARCHAR(255) NOT NULL,
//       company_name VARCHAR(255) NOT NULL,
//       location VARCHAR(255),
//       work_mode VARCHAR(20) NOT NULL,
//       employment_type VARCHAR(30),
//       salary_min NUMERIC,
//       salary_max NUMERIC,
//       salary_currency VARCHAR(10),
//       description TEXT,
//       job_url TEXT,
//       source VARCHAR(50),
//       created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
//     );
//   `);
    pgm.createTable("jobs", {
        id: {
            type: "serial",
            primaryKey: true,
        },

        title: {
            type: "varchar(255)",
            notNull: true,
        },

        company_name: {
            type: "varchar(255)",
            notNull: true,
        },

        location: {
            type: "varchar(255)",
        },

        work_mode: {
            type: "varchar(50)",
            notNull: true,
        },

        employment_type: {
            type: "varchar(50)",
        },

        salary_min: {
            type: "numeric(10, 2)",
        },

        salary_max: {
            type: "numeric(10, 2)",
        },

        salary_currency: {
            type: "varchar(3)",
        },

        description: {
            type: "text",
        },

        job_url: {
            type: "text",
        },

        source: {
            type: "varchar(50)",
        },

        created_at: {
            type: "timestamp",
            notNull: true,
            default: pgm.func("CURRENT_TIMESTAMP"),
        },
    });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.sql(`
    DROP TABLE jobs;
    `);
    pgm.dropTable("jobs");
};
