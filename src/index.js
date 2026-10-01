import express from 'express';
import {randomBytes} from 'node:crypto';

const app = express();
app.use(express.json());


const urls = new Map();

function newCode(){
    let code;
    do{
        code = randomBytes(4).toString('base64url');
    } while(urls.has(code));

    return code;
}


app.get('/',(req,res)=>{
    res.send('URL Shortner is running');
});


app.post('/shorten',(req,res)=>{
    const {url} = req.body || {};
    let parsed;
    try{
        parsed = new URL(url);
    }catch{
        return res.status(400).json({error:'send JSON like {"url":"https://example.com"}'});
    }

    if(!['http:','https:'].includes(parsed.protocol)){
        return res.status(400).json({error:'only http and https link are allowed'});
    }

    const code = newCode();
    urls.set(code,{url:parsed.href,hits:0,createdAt:new Date().toISOString()});
    res.status(201).json({code,shortUrl:`${req.protocol}://${req.get('host')}/${code}` });
});

app.get('/stats/:code',(req,res)=>{
    const entry = urls.get(req.params.code);
    if(!entry) return res.status(404).json({error:'unknown code'});
    res.json({code:req.params.code,...entry});
});

app.get('/:code',(req,res)=>{
    const entry = urls.get(req.params.code);
    if(!entry) return res.status(404).json({error:'unknown code'});
    entry.hits += 1;
    res.redirect(302,entry.url);
});


const port = process.env.PORT || 3000;
app.listen(port,()=>console.log(`Listening on ${port}`));