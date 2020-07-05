const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const sql = require('./sql')
const os = require('os')
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })
const ok = {
    OK: true
}
const not = {
    OK: false
}

app.use(bodyParser.json())
app.use(express.static('uploads'))

// ID 중복 확인 
app.get('/Overlap', (req, res) => {
    const ID = req.query.ID
    sql.IdOverlap(ID, (result = Boolean) => {
        if (result) {
            res.json(ok)
        } else {
            res.json(not)
        }
    })
})

// 회원가입
app.post('/SignUp', (req, res) => {
    const name = req.body['Name']
    const id = req.body['ID']
    const pw = req.body['PW']
    const phone = req.body['Phone']
    const addr = req.body['Addr']
    const cat = req.body['Cat']

    sql.Signup(name, id, pw, phone, addr, cat, (rs) => {
        if (rs) {
            res.json(ok)
        } else {
            res.json(not)
        }
    })
})

// 로그인
app.post('/Login', (req, res) => {
    const id = req.body['ID']
    const pw = req.body['PW']
    const token=req.body['Token']

    sql.Login(id, pw, token, (rs) => {
        console.log(`${rs.ID} 로그인`)
        res.json(rs)
    })
})

app.get('/Pets', (req, res) => {
    const id = req.query.ID
    sql.getPets(id, (rs) => {
        res.json(rs)
    })
})

app.post('/Register/Pet', upload.single('Profile'), (req, res) => {
    console.log(req.file)
    console.log(req.body)
    const fileName = req.file ? req.file.filename : ''
    const memberID = req.body['MemberID']
    const Name = req.body['Name']
    const birth = req.body['Birth']
    const species = req.body['Species']
    const gender = req.body['Gender']
    const weight = req.body['Weight']

    sql.inserPet(memberID, Name, birth, species, gender, weight, fileName, (rs) => {
        if (rs) {
            res.json(not)
        } else {
            res.json(ok)
        }
    })

})

// 가용 매니저 목록
app.get('/AbleManager', (req, res) => {
    const Start = req.query.Start
    const End = req.query.End
    sql.getManagers(Start, End, (rs) => {
        console.log(rs)
        res.json(rs)
    })
})

app.get('/Managers', (req, res) => {
    sql.getAllManagers((rs) => {
        res.json(rs)
    })
})

app.post('/Create/Schedule', (req, res) => {
    // MemberID, ManagerID, PetID, ServiceType, Start, End
    const MemberID = req.body['MemberID']
    const ManagerID = req.body['ManagerID']
    const petId = req.body['PetID']
    const ServiceType = req.body['ServiceType']
    const Start = req.body['Start']
    const End = req.body['End']

    sql.createSchedule(MemberID, ManagerID, petId, ServiceType, Start, End, (rs) => {
        if (rs) {
            res.json(ok)
        } else {
            res.json(not)
        }
    })
})

app.get('/Schedule', (req, res) => {
    const id = req.query.ID
    const limit = req.query.Limit
    sql.getSchedule(id, limit, (rs) => {
        res.json(rs)
    })
})
// 홈화면 리뷰 3개
app.get('/Reviews/All', (req, res) => {
    sql.getAllReviews((rs) => {
        console.log(rs)
        res.json(rs)
    })
})

// 특정 매니저 리뷰 목록
app.get('/Reviews', (req, res) => {
    const id = req.query.ID
    sql.getReviews(id, (rs) => {
        res.json(rs)
    })
})
//# ID, MemberID, ManagerID, Rating, Content

app.post('/Create/Review', (req, res) => {
    const MemberID = req.body['MemberID']
    const ManagerID = req.body['ManagerID']
    const rating = req.body['Rating']
    const content = req.body['Content']

    sql.createReview(MemberID, ManagerID, rating, content, (rs) => {
        if (rs) {
            res.json(ok)
        } else {
            res.json(not)
        }
    })
})

app.get('/Manager/Schedule', (req, res) => {
    const id = req.query.ID
    sql.getMySchedule(id, (rs) => {
        console.log(rs)
        res.json(rs)
    })
})

app.get('/Pet', (req, res)=>{
    const id=req.query.ID
    console.log(id)
    sql.getPet(id, (rs)=>{
        console.log(rs)
        res.json(rs)
    })
})

app.listen(3000, () => {
    console.log(`IP: ${getServerIp()}`)
    console.log('서버 실행 중')
})

function getServerIp() {
    var ifaces = os.networkInterfaces();
    var result = '';
    for (var dev in ifaces) {
        var alias = 0;
        ifaces[dev].forEach(function (details) {
            if (details.family == 'IPv4' && details.internal === false) {
                result = details.address;
                ++alias;
            }
        });
    }
    return result;
}