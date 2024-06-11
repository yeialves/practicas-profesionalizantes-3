const express = require('express');
const app = express();
const cors = require('cors');
const port = 3000;

app.use(cors());
app.use(express.json());

app.post('/calculate', (req, res) => {
    const { calculation } = req.body;
    try {
        const result = eval(calculation);
        res.json({ result });
    } catch (error) {
        res.json({ result: 'Error' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});


