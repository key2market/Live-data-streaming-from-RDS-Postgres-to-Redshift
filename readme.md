### Why use logical replication
  
Logical replication is one option for streaming WAL logs from a Postgres database. It allows for  
outputing the data in a format that can be parsed and used in other applications. For example, the  
lambda in this setup will output a json file such as this:

```json
{
  "changes": [
    {
      "location": "5/A10008D0",
      "xid": "3255",
      "data": "BEGIN 3255"
    },
    {
      "location": "5/A10008D0",
      "xid": "3255",
      "data": "table public.users: INSERT: name[character varying]:'Jason' email[character varying]:'jason@email.com'"
    },
    {
      "location": "5/A1000BE8",
      "xid": "3255",
      "data": "COMMIT 3255"
    }
  ]
}
```
The output of the streamed data, can be changed with an output plugin. This example is using default PostgreSQL  
output plugin "test_decoding". The plugin that is used can be selected when the slot is created:

```sql
SELECT * FROM pg_create_logical_replication_slot('test_slot', 'test_decoding');
```

Custom plugins can be [written](https://www.postgresql.org/docs/9.6/static/logicaldecoding-output-plugin.html). It would be  
simpler to use the lambda to reformat the data, but the plugin might be useful in reducing the amount of data output to  
the replication slot.

It is distinct from physical replication, where WAL is transmitted as changes to the bytes in the database files.

### Before using template
Logical replication should be enabled on the RDS database instance. The [parameter group](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_WorkingWithParamGroups.html) for the database  
should be edited:

```javascript
rds.logical_replication = 1
```

More information about logical replication on AWS RDS can be found [here](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html#PostgreSQL.Concepts.General.FeatureSupport.LogicalReplication)

### Using the Template
  
The template assumes that the RDS instance has it's own vpc security group, and it will add an extra inbound rule  
that gives access to the lambda function.

It uses two availability zones and creates a private subnet in each, these are for the lambda functions. The CIDR blocks  
of the subnet need to be specified, they can be small such as x.x.x.x/24, since the lambda shouldn't need that many IPs to  
run. e.g. 172.31.96.0/24 and 172.31.97.0/24.

Details about the RDS instance, that need to be known: "Endpoint", "Port", "Username", "Password" and the "DB Name"  
(those are the names that AWS uses in the console, except password).

DatabaseHost = "Endpoint"
DatabaseMasterUsername = "Username"
DatabaseMasterPassword = "Password"
DatabaseName = "DB Name"
DatabasePort = "Port"

A name of the logical replication slot can be given, else it defaults to "test_slot". Each slot needs an unique  
name.

Follow these steps to use the template and lambda functions:  
  
```javascript
npm install
// Package the two lambda functions with webpack
npm run webpack
// Upload the lambda packages to a S3 bucket, replace the bucket name
aws cloudformation package --template-file ./templates/rds-lambda.yform -
-s3-bucket <YOUR S3 BUCKET> --output-template-file ./rds-lambda.yform
// Deploy the Cloudformation stack as normal in the console
```

The template creates an S3 bucket to output logs, which is retained when the stack is deleted, it can be deleted  
when no longer needed. The stack could take a while to delete resources, especially the lambda functions since  
they are running in a VPC and depend on ENI to be cleaned up.