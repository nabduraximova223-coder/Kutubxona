require('dotenv').config();
const db = require('./database');

async function test() {
    try {
        console.log("Checking columns...");
        const columns = await db.getAll("SELECT column_name FROM information_schema.columns WHERE table_name = 'books'");
        console.log("Columns:", columns.map(c => c.column_name).join(', '));

        console.log("Test update...");
        // Use a dummy id 1, test if query works
        await db.run(
            "UPDATE books SET rating_sum = rating_sum + $1, rating_count = rating_count + 1 WHERE id = $2",
            [4, 1]
        );
        console.log("Update SUCCESS!");
        process.exit(0);
    } catch (e) {
        console.log("ERROR IS:", e.message);
        process.exit(1);
    }
}
test();
