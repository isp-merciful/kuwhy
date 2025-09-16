const express = require('express');
const router = express.Router();

let wire = null;

function DBconnect(val){
    wire = val;
}

router.post('/', async (req, res) => {
    try{
        const {user_id,blog_title,message} = req.body;
        
        const result = await wire.query(
            'INSERT INTO blog (user_id,blog_title,message) VALUES (?,?,?)',
            [user_id, blog_title, message]
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

router.get('/', async(req,res)=> {
    try{
        let result = await wire.query(`select b.blog_id,b.blog_title,
            b.message,u.img,u.user_name,b.created_at
            from blog b left join users u ON b.user_id = u.user_id
            ORDER BY b.blog_id DESC;

            `
        )
        res.json(result[0])
    }catch(error) {
        console.error(error);
        res.status(500).json({error : 'fetch post fail'});
    }
});


module.exports = { router, DBconnect };