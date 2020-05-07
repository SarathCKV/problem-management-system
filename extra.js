const express = require('express');
let app = express();

const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');
const fs = require('fs');
const Category = require('./models/Category');
const Complaint = require('./models/Complaint');
const { Parser } = require('json2csv');
const json2csv = require('json2csv');

mongoose.connect('mongodb://localhost:27017/probms');

Complaint.find({}).populate('category').then((cat) => {
    //const fields = ['id', 'title', 'date', 'user', 'submitDate', 'category.name'];
    const fields = [
        {
            label: 'Id',
            value: 'id'
        },
        {
            label: 'Title',
            value: 'title'
        },
        {
            label: 'Date of Creation',
            value: 'date'
        },
        {
            label: 'Posted by',
            value: 'user'
        },
        {
            label: 'Deadline',
            value: 'submitDate'
        },
        {
            label: 'Category',
            value: 'category.name'
        },
        {
            label: 'Importance',
            value: 'importance'
        },
        {
            label: 'Status',
            value: 'status'
        },
        {
            label: 'Location',
            value: 'building, floor, room'
        }
    ];
    const json2csvparser = new Parser({fields});
    const csv = json2csvparser.parse(cat);
    console.log(cat);
    console.log(csv);
    fs.writeFile('file4.csv', csv, (err) => {
        console.log('Saved!!');
    });
});

// MongoClient.connect('mongodb://localhost:27017', (err, client) => {
//     var db = client.db('probms');
//     var collection = db.collection('categories');
//     collection.find({name: 'Electricals'}).toArray((err, cat) => {
//         const json2csv = require('json2csv');
//         if(err) {
//             console.log('Error!');
//         }
//         var fields = ['id', 'name'];
//         let csv;
//         csv = json2csv(cat, {fields});

//         fs.writeFile('file.csv', csv, (err) => {
//             console.log('Saved!!!');
//         });
//     })
// })

// mongoose.connect('mongodb://localhost:27017/probms');

// const info = Category.find({}).toArray();

// let date = Date.now();

// const filepath = "./csv-" + date + ".csv";

// const fields = ['id', 'name'];

// let csv = json2csv(info, {fields});

// fs.writeFile(filepath, csv);

// const mongotocsv = require('mongo-to-csv');
// const mongooseToCsv = require('mongoose-to-csv');

// Category.plugin(mongooseToCsv, {
//     headers: 'Id Category'
// });

// MongoClient.connect('mongodb://localhost:27017', (err, client) => {

//     let options = {
//         database: 'probms', // required
//         collection: 'categories', // required
//         fields: ['id','category'], // required
//         output: './pet.csv', // required
//     };
//     mongotocsv.export(options, function (err, success) {
//         console.log(err);
//         console.log(success);
//     });
// });

// Category.findAndStreamCsv({}).pipe(fs.createWriteStream('cat.csv'));