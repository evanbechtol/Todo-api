var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var db = require('./db.js');
var app = express();
var PORT = process.env.PORT || 3000;
var todos = [];
var todoNextId = 1;

app.get('/', function (req, res) {
    res.send('Todo API root');
});

app.use(bodyParser.json());

/* Get individual todo */
app.get('/todos/:id', function (req, res) {
    var todoId = parseInt(req.params.id, 10);

    db.todo.findById(todoId).then(function (todo) {
        if (!_.isNull(todo)) {
            res.json(todo);
        } else {
            res.status(404).json({
                "error": 'No todo found with that id.'
            });
        }

    }).catch(function (err) {
        res.status(500).json(err);
    });
});

/* Get all todos */
app.get('/todos', function (req, res) {
    var query = req.query;
    var where = {};

    if (query.hasOwnProperty('completed') && query.completed === 'true') {
        where.completed = true;
    } else if (query.hasOwnProperty('completed') && query.completed === 'false') {
        where.completed = false;
    }

    if (query.hasOwnProperty('q') && query.q.length > 0) {
        where.description = {
            "$like": '%' + query.q + '%'
        };
    }

    db.todo.findAll({
        "where": where
    }).then(function (todos) {
        res.json(todos);
    }).catch(function (err) {
        res.status(500).send(err);
    });
});

/* POST Create new todo*/
app.post('/todos', function (req, res) {
    var body = _.pick(req.body, 'description', 'completed');

    db.todo.create(body).then(function (todo) {
        res.json(todo.toJSON());
    }).catch(function (err) {
        res.status(400).json(err);
    });
});


/* DELETE a todo */
app.delete('/todos/:id', function (req, res) {
    var todoId = parseInt(req.params.id, 10);
    var matchedTodo;

    /* Find the ID to be Destroyed, destroy it */
    db.todo.destroy({
        "where": {
            "id": todoId
        }
    }).then(function (rowsDeleted) {
        if (rowsDeleted === 0) {
            res.status(404).json({
                "error": "Todo not found"
            });
        } else {
            res.status(204).send();
        }
    }).catch(function (err) {
        res.status(500).json(err);
    });
});

/* PUT */
app.put('/todos/:id', function (req, res) {
    var body = _.pick(req.body, 'description', 'completed');
    var attributes = {};
    var todoId = parseInt(req.params.id, 10);


    /* Validate the completed status */
    if (body.hasOwnProperty('completed')) {
        attributes.completed = body.completed;
    }

    /* Validate the description */
    if (body.hasOwnProperty('description')) {
        attributes.description = body.description;
    }

    db.todo.findById(todoId).then(function (todo) {
        if (!_.isNull(todo)) {
            todo.update(attributes).then(function (todo) {
                res.json(todo.toJSON());
            }, function (e) {
                res.status(400).json(e);
            });
        } else {
            res.status(404).send();
        }
    }, function () {
        res.status(500).send();
    });
});

// Sync the database
db.sequelize.sync().then(function () {
    app.listen(PORT, function () {
        console.log('Express listening on port ' + PORT);
    });
});