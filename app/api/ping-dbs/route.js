import { NextResponse } from 'next/server';
import { Client } from 'pg';

const dbUrls = [
    process.env.DB1_URL,
    process.env.DB2_URL,
    process.env.DB3_URL,
    process.env.DB4_URL
].filter(Boolean);

const dbNames = ['Lockin', 'Medium', 'TaskMaestro', 'Store components'];

// Get selected tables from environment variables
function getSelectedTables() {
    return {
        0: process.env.DB1_TABLE,
        1: process.env.DB2_TABLE,
        2: process.env.DB3_TABLE,
        3: process.env.DB4_TABLE
    };
}

// Save selected tables to environment variables (for reference)
function saveSelectedTables(tables) {
    console.log('✅ Selected tables to add to .env:');
    Object.entries(tables).forEach(([index, table]) => {
        console.log(`DB${parseInt(index) + 1}_TABLE=${table}`);
    });
    console.log('Add these lines to your .env file to persist table selection');
}

// Add timeout wrapper for database operations
async function withTimeout(promise, timeoutMs = 10000) {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(
                () => reject(new Error('Operation timed out')),
                timeoutMs
            )
        )
    ]);
}

async function pingDb(url, name, dbIndex) {
    let client = null;
    try {
        const urlObj = new URL(url);

        client = new Client({
            user: urlObj.username,
            password: urlObj.password,
            host: urlObj.hostname,
            port: urlObj.port,
            database: urlObj.pathname.substring(1),
            ssl: {
                rejectUnauthorized: false,
                require: true
            },
            // Add connection timeout
            connectionTimeoutMillis: 5000,
            // Add query timeout
            statement_timeout: 5000,
            // Add idle timeout
            idle_in_transaction_session_timeout: 5000
        });

        // Connect with timeout
        await withTimeout(client.connect(), 5000);

        // Get selected tables from environment
        const selectedTables = getSelectedTables();
        
        // If we haven't selected a table for this database yet, get tables and select one
        if (!selectedTables[dbIndex]) {
            console.log(`No table selected for database ${name} (index: ${dbIndex}), getting tables...`);
            
            const tablesQuery = `
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_type = 'BASE TABLE'
                ORDER BY table_name;
            `;
            
            const tablesResult = await withTimeout(client.query(tablesQuery), 3000);
            const tables = tablesResult.rows.map(row => row.table_name);
            
            console.log(`Available tables for ${name}:`, tables);
            
            if (tables.length === 0) {
                return { 
                    name, 
                    status: 'success', 
                    message: 'Connected successfully - No tables found',
                    selectedTable: null,
                    selectedItem: null
                };
            }

            // Select the first non-migration table, or fallback to first table
            const nonMigrationTables = tables.filter(table => !table.startsWith('_'));
            const tableToUse = nonMigrationTables.length > 0 ? nonMigrationTables[0] : tables[0];
            selectedTables[dbIndex] = tableToUse;
            
            // Show what to add to .env
            saveSelectedTables(selectedTables);
            
            console.log(`✅ SELECTED table '${tableToUse}' for database '${name}' (index: ${dbIndex})`);
        } else {
            console.log(`🔄 Using env table '${selectedTables[dbIndex]}' for database '${name}' (index: ${dbIndex})`);
        }

        const selectedTable = selectedTables[dbIndex];
        
        // Get 1 item from the selected table
        const itemQuery = `
            SELECT * FROM "${selectedTable}" 
            ORDER BY RANDOM() 
            LIMIT 1;
        `;
        
        const itemResult = await withTimeout(client.query(itemQuery), 5000);
        const selectedItem = itemResult.rows[0] || null;

        return { 
            name, 
            status: 'success', 
            message: 'Connected successfully and retrieved item from selected table',
            selectedTable: selectedTable,
            selectedItem: selectedItem
        };
    } catch (error) {
        console.error(`Database ${name} ping failed:`, error.message);
        return {
            name,
            status: 'error',
            message: error.message,
            timestamp: new Date().toISOString()
        };
    } finally {
        if (client) {
            try {
                await client.end();
            } catch (endError) {
                console.error(
                    `Error closing connection for ${name}:`,
                    endError.message
                );
            }
        }
    }
}

export async function GET() {
    const startTime = Date.now();

    try {
        // Validate environment variables
        if (dbUrls.length === 0) {
            return NextResponse.json(
                {
                    ok: false,
                    error: 'No database URLs configured',
                    timestamp: new Date().toISOString()
                },
                { status: 500 }
            );
        }

        console.log(`Starting database ping for ${dbUrls.length} databases`);

        const results = await Promise.allSettled(
            dbUrls.map((url, index) =>
                pingDb(url, dbNames[index] || `Database ${index + 1}`, index)
            )
        );

        // Process results
        const processedResults = results.map((result, index) => {
            if (result.status === 'fulfilled') {
                return result.value;
            } else {
                return {
                    name: dbNames[index] || `Database ${index + 1}`,
                    status: 'error',
                    message: result.reason?.message || 'Unknown error',
                    timestamp: new Date().toISOString()
                };
            }
        });

        const executionTime = Date.now() - startTime;
        const successCount = processedResults.filter(
            (r) => r.status === 'success'
        ).length;
        const totalCount = processedResults.length;

        // Calculate summary statistics
        const successfulResults = processedResults.filter(r => r.status === 'success');
        const itemsRetrieved = successfulResults.filter(r => r.selectedItem !== null).length;

        // Get stored tables from environment
        const storedTables = getSelectedTables();

        console.log(
            `Database ping completed in ${executionTime}ms. ${successCount}/${totalCount} successful. Retrieved ${itemsRetrieved} items.`
        );

        return NextResponse.json({
            ok: successCount > 0, // Consider successful if at least one DB responds
            results: processedResults,
            storedTables: storedTables, // Show which tables are stored in env
            summary: {
                total: totalCount,
                successful: successCount,
                failed: totalCount - successCount,
                itemsRetrieved: itemsRetrieved,
                executionTimeMs: executionTime
            },
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error('Unexpected error in ping-dbs API:', err);
        return NextResponse.json(
            {
                ok: false,
                error: err.message,
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
}
