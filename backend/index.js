const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

let wire = null;

const waitconnection = async () => {
    wire = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'ispgayweead',
        database: 'ispgraveyard',
        port: 3306
    });
    console.log("MySQL connected");
};

app.post('/api/create_users', async (req, res) => {
    try{
        const {user_id,user_name,gender} = req.body;
        
        const result = await wire.query(
            'INSERT INTO users (user_id,user_name,gender) VALUES (?,?,?)',
            [user_id, user_name, gender]
        );
        res.json({
            message: 'inserted',
            insertedId: result.insertId
        });

    } catch(error) {
        console.error(error);
        res.status(500).json({error : 'Database insert failed'});
    }
});

app.get('/api/get_alluser', async(req,res) =>{
    try{
        let result = await wire.query('SELECT * from users'
        )
        res.json(result[0])
    }catch(error) {
        console.error(error);
        res.status(500).json({error : 'fetch user fail'});
    }

});
app.get('/api/note_api', async(req,res)=> {
    try{
        let result = await wire.query(`select n.note_id,n.massage,
            u.img,u.user_name,n.created_at
            from note n join users u ON n.author = u.user_id
            `
        )
        res.json(result[0])
    }catch(error) {
        console.error(error);
        res.status(500).json({error : 'fetch post fail'});
    }
});

app.post('/api/note_api', async(req,res) => {
    try{
        const { user_id,massage,created_at } = req.body;
        if (!massage || !user_id) {
            throw new Error('ไม่มีผู้ใช้หรือไม่มีnotes')
        
    }   
        
        const result = await wire.query(
            'INSERT INTO note (author,massage,created_at) VALUES (?,?,?)',
            [user_id, massage, created_at]);
        console.log("แอดระ");
        res.json(result[0])
            
    }catch(error) {
        console.error(error);
        res.status(500).json({error : 'add notes fail'});
    }
});

app.delete('/api/note_api', async(req,res) => {
    try{

    }catch(error){
        console.error(error);
        res.status(500).json({
            error:"can't deleted "
        })
    }
})

app.listen(8000, async () => {
    await waitconnection();
    console.log("Server running on port 8000");
});
