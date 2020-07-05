const mysql = require('mysql')
const fs = require('fs')
const e = require('express')
const fcm=require('./fcm')

const connection = mysql.createConnection({
    host: 'personal.ccjr0vkmc5nd.ap-northeast-2.rds.amazonaws.com',
    user: 'ubuntu',
    password: 'Fucker0916!',
    database: 'Pet'
})

// 아이디 재사용 여부 반환
exports.IdOverlap = (ID = String, callback) => {
    const query = `select count(ID) cnt from Members where ID='${ID}'`
    connection.query(query, (e0, rs) => {
        if (e0) {
            console.error(e0)
            callback(false)
        } else {
            const cnt = rs[0].cnt;
            if (cnt != 0) {
                callback(false)
            } else {
                callback(true)
            }
        }
    })
}

exports.Signup = (name = String, id = String, pw = String, phone = String, addr = String, cat = Number, callback) => {
    const query = `insert into Members set ID='${id}', Name='${name}', Password='${pw}', Phone='${phone}', Addr='${addr}', Cat=${cat}`
    connection.query(query, (e0) => {
        if (e0) {
            console.error(e0)
            callback(false)
        } else {
            callback(true)
        }
    })
}

exports.Login = (id = String, pw = String, Token=String, callback) => {
    const query = `select Name, ID, Addr, Phone, Cat from Members where ID='${id}' and Password='${pw}'`
    connection.query(query, (e0, rs) => {
        if (e0) {
            console.error(e0)
            callback(null)
        } else {
            if (rs[0]) {
                const updateQuery=`update Members set Token='${Token}' where ID='${id}'`
                connection.query(updateQuery, (e1)=>{
                    if(e1) {
                        console.error(e1)
                    } 
                })
                callback({
                    Name: rs[0].Name,
                    ID: rs[0].ID,
                    Addr: rs[0].Addr,
                    Phone: rs[0].Phone,
                    Cat: rs[0].Cat
                })
            } else {
                callback(null)
            }
        }
    })
}

exports.getPets = (id = String, callback) => {
    const query = `select ID, Img, Name, date_format(Birth, '%Y-%m-%d') Birth, Species, Gender, Weight from Pet where MemberID='${id}'`
    connection.query(query, (e0, rs) => {
        if (e0) {
            console.error(e0)
            callback(null)
        } else {
            callback(rs)
        }
    })
}

exports.inserPet = (memberID = String, name = String, birth = String, species = String, gender = String, weight = Number, fileName = String, callback) => {
    const query = `insert into Pet set MemberID=${memberID}, Img="${fileName}", Name=${name}, Birth=${birth}, Species=${species}, Gender=${gender}, Weight=${weight}`
    console.log(query)

    connection.query(query, (e0, rs) => {
        if (e0) {
            console.error(e0)
            callback(false)
        } else {
            callback(true)
        }
    })

}

exports.getManagers = (Start = String, End = String, callback) => {
    const query = `select ID, Name, Phone, Rate from Members where Cat=1 and ID not in(
        select ManagerID from Schedule where End>'${Start}' and Start<'${End}')`
    console.log(query)
    connection.query(query, (e0, rs) => {
        if (e0) {
            console.error(e0)
            callback(null)
        } else {
            callback(rs)
        }
    })
}

exports.createSchedule = (MemberID = String, ManagerID = String, PetID = Number, ServiceType = Number, Start = String, End = String, callback) => {
    const query = `insert into Schedule set MemberID='${MemberID}', ManagerID='${ManagerID}', PetID=${PetID}, ServiceType=${ServiceType}, Start='${Start}', End='${End}'`
    const tokenQuery=`select Token from Members where ID='${ManagerID}'`
    connection.query(query, (e0, rs) => {
        if (e0) {
            console.error(e0)
            callback(false)
        } else {
            connection.query(tokenQuery, (e1, rs1)=>{
                if(e1) {
                    console.error(e1)
                } else {
                    const token=rs1[0].Token
                    fcm.sendFcm(token, '새로운 예약이 추가되었습니다.')
                }
            })
            callback(true)
        }
    })
}

exports.getSchedule = (MemberID = String, Limit = Number, callback) => {
    const query = `select SS.*, PT.Name Pet from 
    (select S.*, M.Name Manager from 
    (select ManagerID , PetID,
    date_format(Start, '%m') Month,
    date_format(Start, '%d') Day,
     if (ServiceType=0, '돌봄', '산책') Service, concat(date_format(Start,'%Y년 %m월 %d일 '),
     SUBSTR(_UTF8'일월화수목금토', DAYOFWEEK(Start), 1), '요일') Date,
     date_format(Start, '%H시 %i분') Time
     from Schedule where MemberID='${MemberID}') S left outer join Members M
     on S.ManagerID=M.ID) SS left outer join Pet PT
     on SS.PetID=PT.ID order by Date limit ${Limit}`

    connection.query(query, (e0, rs) => {
        if (e0) {
            console.error(e0)
            callback(null)
        } else {
            callback(rs)
        }
    })
}

exports.getReviews = (ManagerID = String, callback) => {
    const managerQuery = `select Name, Rate from Members where ID='${ManagerID}'`
    console.log(managerQuery)
    const scheduleQuery = `select count(ID) ScheduleCnt from Schedule where ManagerID='${ManagerID}'`
    const reviewCntQuery = `select count(ID) ReviewCnt from Reviews where ManagerID='${ManagerID}'`
    const reviewQuery = `select R.*, M.Name MemberName from 
    (select MemberID, Rating, Content from Reviews where ManagerID='${ManagerID}') R
    left outer join Members M
    on R.MemberID=M.ID`
    var result = {
        Name: null,
        Rate: 0,
        ScheduleCnt: 0,
        ReviewCnt: 0,
        Reviews: []
    }

    connection.query(managerQuery, (e0, rs0) => {
        if (e0) {
            console.error(e0)
        } else {
            result.Name = rs0[0].Name
            result.Rate = rs0[0].Rate
        }
        connection.query(scheduleQuery, (e1, rs1) => {
            if (e1) {
                console.error(e1)
            } else {
                result.ScheduleCnt = rs1[0].ScheduleCnt
            }
            connection.query(reviewCntQuery, (e2, rs2) => {
                if (e2) {
                    console.error(e2)
                } else {
                    result.ReviewCnt = rs2[0].ReviewCnt
                }
                connection.query(reviewQuery, (e3, rs3) => {
                    if (e3) {
                        console.error(e3)
                    } else {
                        for (var i = 0; i < rs3.length; i++) {
                            result.Reviews.push(rs3[i])
                        }
                    }
                    callback(result)
                })
            })
        })
    })
}

exports.getAllReviews = (callback) => {
    const query = `select R.*, M.Name MemberName from 
    (select ID, MemberID, Rating, Content from Reviews ) R
    left outer join Members M
    on R.MemberID=M.ID order by ID  desc limit 3`
    connection.query(query, (e0, rs) => {
        if (e0) {
            console.error(e0)
            callback(null)
        } else {
            callback(rs)
        }
    })
}

exports.createReview = (MemberID = String, ManagerID = String, Rating = Number, Content = String, callback) => {
    const insertQuery = `insert into Reviews set MemberID='${MemberID}', ManagerID='${ManagerID}', Rating=${Rating}, Content='${Content}'`
    const getRateQuery = `select avg(Rating) rate from Reviews where ManagerID='${ManagerID}'`

    connection.query(insertQuery, (e0) => {
        if (e0) {
            console.log(e0)
            callback(false)
        } else {
            connection.query(getRateQuery, (e1, rs) => {
                if (e1) {
                    console.error(e1)
                    callback(false)
                } else {
                    const rate = rs[0].rate
                    const updateQuery = `update Members set Rate=${rate} where ID='${ManagerID}'`
                    connection.query(updateQuery, (e2) => {
                        if (e2) {
                            console.error(e2)
                            callback(false)
                        } else {
                            callback(true)
                        }
                    })
                }
            })
        }
    })
}

exports.getAllManagers = (callback) => {
    const query = `select ID, Name, Phone, Rate from Members where Cat=1`
    connection.query(query, (e0, rs) => {
        if (e0) {
            console.log(e0)
            callback(null)
        } else {
            callback(rs)
        }
    })
}

exports.getMySchedule = (id = String, callback) => {
    const query = `select SC.*, MM.Name MemberName, MM.Phone, MM.Addr from (
        select S.MemberID, ServiceType, PetID, date_format(Start, '%Y-%m-%d %H:%i') Start,
        date_format(End, '%Y-%m-%d %H:%i') End,
        P.Name PetName from 
        Schedule S left outer join Pet P on S.PetID=P.ID 
        where ManagerID='${id}') SC left outer join Members MM
        on SC.MemberID=MM.ID`

    connection.query(query, (e0, rs) => {
        if (e0) {
            console.error(e0)
            callback(null)
        } else {
            callback(rs)
        }
    })
}

exports.getPet = (id = Number, callback) => {
    const query = `select ID, MemberID, Img, Name, date_format(Birth, '%Y-%m-%d') Birth, Species, Gender, Weight from Pet where ID=${id}`
    connection.query(query, (e0, rs) => {
        if (e0) {
            console.error(e0)
            callback(null)
        } else {
            callback(rs[0])
        }
    })
}