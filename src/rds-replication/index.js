const { Client } = require("pg");
const cfn_response = require("cfn-response-promise");

exports.handler = async (event, context) => {
    console.log(`event received: ${JSON.stringify(event)}`);
    let slot_name = event.ResourceProperties.SlotName;
    if (!slot_name) {
        console.log(`no slot name`);
        return await cfn_response.send(event, context, cfn_response.FAILED);
    }

    const client = new Client({
        user: event.ResourceProperties.PGUSER,
        password: event.ResourceProperties.PGPASSWORD,               
        port: event.ResourceProperties.PGPORT,
        host: event.ResourceProperties.PGHOST,
        database: event.ResourceProperties.PGDATABASE
    });

    try {
        await client.connect();
    }
    catch (e) {
        console.log(`pg client could not connect: ${JSON.stringify(e)}`);
        return await cfn_response.send(event, context, cfn_response.FAILED);
    }

    if (event.RequestType === "Create") {              
        console.log("creating slot");
        try {
            let result = await client.query(`SELECT * FROM pg_create_logical_replication_slot('${slot_name}', 'test_decoding')`);          
            console.log(result);
            client.end();
            return await cfn_response.send(event, context, cfn_response.SUCCESS);
        }
        catch (e) {
            console.log(`replication slot create error: ${JSON.stringify(e)}.`)        
            client.end();
            return await cfn_response.send(event, context, cfn_response.FAILED);
        }      
    }
    else if (event.RequestType === "Delete") {
        console.log("deleting slot");
        try {
            let result = await client.query(`SELECT pg_drop_replication_slot('${slot_name}')`);        
            console.log(result);
            client.end();
            return await cfn_response.send(event, context, cfn_response.SUCCESS);
        }
        catch (e) {
            console.log(`replication slot delete error: ${JSON.stringify(e)}.`)        
            client.end();
            return await cfn_response.send(event, context, cfn_response.FAILED);
        }
    }
    else {
        //event.RequestType === "Update"
        client.end();
        return await cfn_response.send(event, context, cfn_response.SUCCESS);
    }
};