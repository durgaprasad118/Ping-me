import { NextResponse } from 'next/server';
import { Client } from 'pg';

const dbUrls = [
    process.env.DB1_URL,
    process.env.DB2_URL,
    process.env.DB3_URL
].filter(Boolean);

const dbNames = [
    'Lockin',
    'Medium', 
    'TaskMaestro'
];

// Add timeout wrapper for database operations
async function withTimeout(promise, timeoutMs = 10000) {
    return Promise.race([
        promise,
        new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
        )
    ]);
}

async function pingDb(url, name) {
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
        
        // Simple query with timeout
        await withTimeout(client.query('SELECT 1;'), 3000);
        
        return { name, status: 'success', message: 'Connected successfully' };
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
                console.error(`Error closing connection for ${name}:`, endError.message);
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
            dbUrls.map((url, index) => pingDb(url, dbNames[index] || `Database ${index + 1}`))
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
        const successCount = processedResults.filter(r => r.status === 'success').length;
        const totalCount = processedResults.length;
        
        console.log(`Database ping completed in ${executionTime}ms. ${successCount}/${totalCount} successful`);
        
        return NextResponse.json({ 
            ok: successCount > 0, // Consider successful if at least one DB responds
            results: processedResults,
            summary: {
                total: totalCount,
                successful: successCount,
                failed: totalCount - successCount,
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
