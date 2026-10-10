const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { beforeAll, afterEach, afterAll } = require('bun:test');
const fs = require('fs');
const path = require('path');

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGODB_URI = uri;
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.JWT_EXPIRES_IN = '1h';
    await mongoose.connect(uri);
});

afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }

    const uploadsDir = path.join(__dirname, '../uploads');
    const files = fs.readdirSync(uploadsDir);
    for (const file of files) {
        if (file !== '.gitkeep') {
            fs.unlinkSync(path.join(uploadsDir, file));
        }
    }
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});
