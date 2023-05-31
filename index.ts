import { PrismaClient } from '@prisma/client'
import bcrypt from "bcrypt"
import express from 'express';
import http from 'http';

const app = express();
const server = http.createServer(app);

const prisma = new PrismaClient()
const User: any = new Map()

async function UserCache(){
    const UserList = await prisma.gebruikers.findMany()
    UserList.forEach(user => {User.set(user.Username, { Password: user.Password})})
} UserCache()

app.use(express.json());
app.use(express.urlencoded({ extended: true }))

app.get('/api/status', async (req, res) => {
    const Data = await prisma.rooster.findMany({ where: {Name: "Weekend"} })
    if(Data) return res.status(200).json({ message: "The request was successful"});
    return res.status(404).json({ message: "The requested resource could not be found"});
})

app.get('/api/rooster', async (req, res) => {

    const Header = req.headers
    if(!Header.authorization)
        return res.status(401).json({ message: 'Access to the requested resource is unauthorized' });

    const authHeader: any = Header.authorization?.split(",");
    const [Password, Username] = authHeader
    
    const USER = User.get(Username)
    const match = USER ? await bcrypt.compare(Password, USER.Password) : false;
    
    if (USER && match) {
        const rooster = await prisma.rooster.findMany();
        return res.status(200).json({ message: 'The request was successful', response: rooster });
    } return res.status(401).json({message: 'Access to the requested resource is unauthorized' });
});

app.post('/api/rooster', async (req, res) => {
    const Header = req.headers
    if(!Header.authorization)
        return res.status(401).json({ message: 'Access to the requested resource is unauthorized' });

    const authHeader: any = Header.authorization?.split(",");
    const [Password, Username] = authHeader
    const USER = User.get(Username)
    const match = USER ? await bcrypt.compare(Password, USER.Password) : false;
    
    if (USER && match) {
        const {Name, data} = req.body
        const ItemFound = await prisma.rooster.updateMany({ where: { Name: Name }, data: { Lessons: { push: data } }});

        if(ItemFound.count != 0) {
            const updated = await prisma.rooster.findMany({ where: { Name: Name}});
            return res.status(200).json({ message: 'The request was successful', response: updated[0]});
        } 
        return res.status(404).json({ message: 'The requested resource could not be found' });
    } return res.status(401).json({ message: 'Access to the requested resource is unauthorized' });
});

app.put('/api/rooster', async (req, res) => {

})

app.delete('/api/rooster', async (req, res) => {
    const Header = req.headers
    if(!Header.authorization)
        return res.status(401).json({ message: 'Access to the requested resource is unauthorized' });

    const authHeader: any = Header.authorization?.split(",");
    const [Password, Username] = authHeader
    const USER = User.get(Username)
    const match = USER ? await bcrypt.compare(Password, USER.Password) : false;
    
    if (USER && match) {
        const { Name, Class } = req.body
        const ItemGet = await prisma.rooster.findMany({ where: { Name: Name}});
        const ItemFound = ItemGet[0].Lessons.find(item => item.Class === Class)
        
        if (ItemFound) {
            const data = ItemGet[0].Lessons = ItemGet[0].Lessons.filter(lesson => lesson.Class !== Class);
            await prisma.rooster.updateMany({ where: { Name: Name }, data: { Lessons: data }});
            return res.status(200).json({ message: 'The request was successful', response: data});
        }
        return res.status(404).json({ message: 'The requested resource could not be found' });
    } return res.status(401).json({ message: 'Access to the requested resource is unauthorized' });

    
})

server.listen(3000);
