const { Pool } = require("pg");
const { S3 } = require("aws-sdk");

const pg_client_pool = new Pool({
    max: 1
});

const s3_client = new S3();

exports.handler = async (event) => {
    
    const client = await pg_client_pool.connect();

    let slot_name = process.env.SlotName;
    
    // Third parameter can limit the number of rows to return
    let result = await client.query(`SELECT * FROM pg_logical_slot_get_changes('${slot_name}', NULL, NULL);`);
    let changes = result.rows;
    if (changes.length > 0) {
        let output = JSON.stringify({ changes }, null, 2);
        let date = Date.now();
        let key = process.env.PGDATABASE + "_"  + date;
        try {
            await s3_client.upload({ Bucket: process.env.BUCKETNAME, Key: `${key}.json`, Body: output }).promise();
        }
        catch(e) {
            console.log(`s3 upload error: ${JSON.stringify(e)}`);
        }
    }

    client.release();
};