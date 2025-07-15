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

async function pingDb(url, name) {
    try {
        const urlObj = new URL(url);
        
        const client = new Client({
            user: urlObj.username,
            password: urlObj.password,
            host: urlObj.hostname,
            port: urlObj.port,
            database: urlObj.pathname.substring(1),
            ssl: {
                rejectUnauthorized: false,
                require: true
            }
        });
        
        await client.connect();
        await client.query('SELECT 1;');
        await client.end();
        
        return { name, status: 'success', message: 'Connected successfully' };
    } catch (error) {
        return { name, status: 'error', message: error.message };
    }
}

export async function GET() {
    try {
        const results = await Promise.all(
            dbUrls.map((url, index) => pingDb(url, dbNames[index] || `Database ${index + 1}`))
        );
        
        return NextResponse.json({ 
            ok: true, 
            results,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        return NextResponse.json(
            { ok: false, error: err.message },
            { status: 500 }
        );
    }
}
