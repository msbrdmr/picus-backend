const express = require('express');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();




const dynamoDBClient = new DynamoDBClient({
  region: 'eu-central-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const dynamoDB = DynamoDBDocumentClient.from(dynamoDBClient);


const app = express();
const PORT = 3000;

app.use(bodyParser.json());

const table_name = 'Users';

app.get('/picus/list', async (req, res) => {
  const params = {
    TableName: table_name,
  };
  try {
    const data = await dynamoDB.send(new ScanCommand(params));
    res.json(data.Items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not fetch data' });
  }
});


app.post('/picus/put', async (req, res) => {
  const { body } = req;
  const id = uuidv4();

  const params = {
    TableName: TABLE_NAME,
    Item: {
      id,
      ...body
    }
  };

  try {
    await dynamoDB.send(new PutCommand(params));
    res.json({ message: 'Item added successfully', id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not add item' });
  }
});

app.get('/picus/get/:key', async (req, res) => {
  const { key } = req.params;

  const params = {
    TableName: TABLE_NAME,
    Key: {
      id: key
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
    console.error(error);
    res.status(500).json({ error: 'Could not retrieve item' });
  }
});

// test endpoint
app.get('/picus/test', (req, res) => {
  let return_json = {
    message: 'Hello, Picus!'
  }

  res.json(return_json);
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});