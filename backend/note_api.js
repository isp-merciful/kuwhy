const express = require('express');
const router = express.Router();

let wire = null;

function DBconnect(val){
    wire = val;
}


router.get('/', async(req,res)=> {
    try{
        let result = await wire.query(`select n.note_id,n.message,
            u.img,u.user_name,n.created_at
            from note n left join users u ON n.user_id = u.user_id
            ORDER BY n.note_id DESC;

            `
        )
        res.json(result[0])
    }catch(error) {
        console.error(error);
        res.status(500).json({error : 'fetch post fail'});
    }
});


router.post('/', async (req, res) => {
  try {
    const {message, user_id } = req.body; 
    console.log(req.body)
    if (!message) {
      throw new Error('ไม่มี notes');
    }
    if (!user_id) {
      return res.status(400).json({ error: 'Missing user_id' });
    }


    const [noteResult] = await wire.query(
      'INSERT INTO note (message, user_id) VALUES (?, ?)',
      [message, user_id]
    );

    console.log('Note added with id:', noteResult.insertId, 'user_id:', user_id);

    res.status(201).json({  
      message:"add note success",
      value : noteResult
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'add notes fail'});
  }
});



router.delete('/:id', async(req,res) => {
    try{
      const [result] = await wire.query(
        'delete from note where note_id = ?',[req.params.id]
      )
    res.json('delete success');
    }catch(error){
        console.error(error);
        res.status(500).json({
            error:"can't deleted "
        })
    }
});
module.exports = { router, DBconnect };




