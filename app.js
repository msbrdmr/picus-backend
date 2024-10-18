const express = require('express');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const bodyParser = require('body-parser');
require('dotenv').config();
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

const secret_name = "dynamoDB-userCredentials";
const app = express();
const PORT = 3000;
app.use(bodyParser.json());

const table_name = 'employee_info';

const generate_id = (length) => {
  return Math.floor(Math.pow(10, length - 1) + Math.random() * 9 * Math.pow(10, length - 1));
};

(async () => {
  const client = new SecretsManagerClient({ region: "eu-central-1" });
  
  let response;
  let dynamoDB;

  try {
    response = await client.send(new GetSecretValueCommand({
      SecretId: secret_name,
      VersionStage: "AWSCURRENT",
    }));
    const secret = JSON.parse(response.SecretString);

    const dynamoDBClient = new DynamoDBClient({
      region: secret.AWS_REGION,
      credentials: {
        accessKeyId: secret.AWS_ACCESS_KEY_ID,
        secretAccessKey: secret.AWS_SECRET_ACCESS_KEY,
      },
    });

    dynamoDB = DynamoDBDocumentClient.from(dynamoDBClient);
  } catch (error) {
    console.error('Error retrieving secret or initializing DynamoDB:', error);
    process.exit(1); 
  }

  app.get('/picus/list', async (req, res) => {
    const params = {
      TableName: table_name,
    };
    try {
      const data = await dynamoDB.send(new ScanCommand(params));
      res.json(data.Items);
    } catch (error) {
      console.error('Error fetching data:', error);
      res.status(500).json({ error: 'Could not fetch data' });
    }
  });

  app.post('/picus/put', async (req, res) => {
    const { body } = req;
    const id = generate_id(5) + '';

    const params = {
      TableName: table_name,
      Item: {
        employeid: id,
        ...body
      }
    };

    try {
      await dynamoDB.send(new PutCommand(params));
      res.json({ message: 'Item added successfully', id });
    } catch (error) {
      console.error('Error adding item:', error);
      res.status(500).json({ error: 'Could not add item' });
    }
  });

  app.get('/picus/get/:key', async (req, res) => {
    const { key } = req.params;

    const params = {
      TableName: table_name,
      Key: {
        employeid: key
      }
    };

    try {
      const data = await dynamoDB.send(new GetCommand(params));
      if (data.Item) {
        res.json(data.Item);
      } else {
        console.log('Item not found');
        res.status(404).json({ error: 'Item not found' });
      }
    } catch (error) {
      console.error('Error retrieving item:', error);
      res.status(500).json({ error: 'Could not retrieve item' });
    }
  });

  app.get('/picus/test', (req, res) => {
    res.json({ message: 'Hello, Picus!' });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
})();