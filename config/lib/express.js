'use strict';

/**
 * Module dependencies.
 */
var config         = require('../config'),
    compress       = require('compression'),
    consolidate    = require('consolidate'),
    express        = require('express'),
    favicon        = require('serve-favicon'),
    methodOverride = require('method-override'),
    morgan         = require('morgan'),
    logger         = require('./logger'),
    bodyParser     = require('body-parser'),
    path           = require('path'),
    session        = require('express-session'),
    MongoStore     = require('connect-mongo')(session),
    _              = require('lodash');


/**
 * Initialize local variables
 */
module.exports.initLocalVariables = function (app) {
    // Setting application local variables
    app.locals.title       = config.app.title;
    app.locals.description = config.app.description;
    app.locals.keywords    = config.app.keywords;
    app.locals.jsFiles     = config.files.client.js;
    app.locals.cssFiles    = config.files.client.css;
    app.locals.livereload  = config.livereload;
    app.locals.favicon     = config.favicon;
    app.locals.env         = process.env.NODE_ENV;

    // Passing the request url to environment locals
    app.use(function (req, res, next) {
        res.locals.host = req.protocol + '://' + req.hostname;
        res.locals.url  = req.protocol + '://' + req.headers.host + req.originalUrl;
        next();
    });
};


/**
 * Initialize application middleware
 */
module.exports.initMiddleware = function (app) {
    // Should be placed before express.static
    app.use(compress({
        filter: function (req, res) {
            return (/json|text|javascript|css|font|svg/).test(res.getHeader('Content-Type'));
        },
        level : 9
    }));

    // Initialize favicon middleware
    app.use(favicon(app.locals.favicon));

    // Enable logger (morgan) if enabled in the configuration file
    if (_.has(config, 'log.format')) {
        app.use(morgan(logger.getLogFormat(), logger.getMorganOptions()));
    }

    // Environment dependent middleware
    if (process.env.NODE_ENV === 'development') {
        // Disable views cache
        app.set('view cache', false);
    } else if (process.env.NODE_ENV === 'production') {
        app.locals.cache = 'memory';
    }

    // Request body parsing middleware should be above methodOverride
    app.use(bodyParser.urlencoded({
        extended: true
    }));
    app.use(bodyParser.json());
    app.use(methodOverride());
};


/**
 * Configure view engine
 */
module.exports.initViewEngine = function (app) {
    // Set pug as the template engine
    app.engine('server.view.pug', consolidate[config.templateEngine]);

    // Set views path and view engine
    app.set('view engine', 'server.view.pug');
    app.set('views', './');
};


/**
 * Configure the modules static routes
 */
module.exports.initModulesClientRoutes = function (app) {
    // Setting the app router and static folder
    app.use('/', express.static(path.resolve('./public')));
    app.use('/', express.static(path.resolve('.')));

    // Globbing static routing
    config.folders.client.forEach(function (staticPath) {
        app.use(staticPath, express.static(path.resolve('./' + staticPath)));
    });
};


/**
 * Configure the modules server routes
 */
module.exports.initModulesServerRoutes = function (app) {
    // Globbing routing files
    config.files.server.routes.forEach(function (routePath) {
        require(path.resolve(routePath))(app);
    });
};

/**
 * Configure Express session
 */
module.exports.initSession = function (app, db) {
    // Express MongoDB session storage
    app.use(session({
        saveUninitialized: true,
        resave           : true,
        secret           : config.sessionSecret,
        cookie           : {
            maxAge  : config.sessionCookie.maxAge,
            httpOnly: config.sessionCookie.httpOnly,
            secure  : config.sessionCookie.secure && config.secure.ssl
        },
        name             : config.sessionKey,
        store            : new MongoStore({
            mongooseConnection: db.connection,
            collection        : config.sessionCollection
        })
    }));
};

/**
 * Invoke modules server configuration
 */
module.exports.initModulesConfiguration = function (app, db) {
    config.files.server.configs.forEach(function (configPath) {
        require(path.resolve(configPath))(app, db);
    });
};

/**
 * Initialize the Express application
 */
module.exports.init = function (db) {
    // Initialize express app
    var app = express();

    // Initialize local variables
    this.initLocalVariables(app);

    // Initialize Express middleware
    this.initMiddleware(app);

    // Initialize Express view engine
    this.initViewEngine(app);

    // Initialize modules static client routes, before session!
    this.initModulesClientRoutes(app);

    // Initialize Express session
    this.initSession(app, db);

    // Initialize Modules configuration
    this.initModulesConfiguration(app);

    // Initialize modules server routes
    this.initModulesServerRoutes(app);


    return app;
};
