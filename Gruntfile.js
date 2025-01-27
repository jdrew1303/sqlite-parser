module.exports = function(grunt) {
  function getBanner(isDemo) {
    return '/*!\n' +
     ' * <%= pkg.name %>' + (isDemo ? '-demo' : '') + ' - v<%= pkg.version %>\n' +
     ' * @copyright <%= grunt.template.today("yyyy") %> <%= pkg.author %>\n' +
     ' * @author Nick Wronski <nick@javascript.com>\n' +
     ' */';
  }
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    browserify: {
      dist: {
        options: {
          browserifyOptions: {
            debug: false,
            standalone: 'sqliteParser'
          }
        },
        src: ['index.js'],
        dest: 'dist/sqlite-parser.js'
      },
      interactive: {
        options: {
          alias: {
            'sqlite-parser': './index',
            'sqlite-parser-util': './lib/parser-util',
            'codemirror': './node_modules/codemirror/lib/codemirror',
            'foldcode': './node_modules/codemirror/addon/fold/foldcode',
            'foldgutter': './node_modules/codemirror/addon/fold/foldgutter',
            'brace-fold': './node_modules/codemirror/addon/fold/brace-fold',
            'panel': './node_modules/codemirror/addon/display/panel',
            'mode-javascript': './node_modules/codemirror/mode/javascript/javascript',
            'mode-sql': './node_modules/codemirror/mode/sql/sql'
          },
        },
        require: [
          'lib/parser-util.js', 'lib/parser.js', './index.js',
          'node_modules/codemirror/lib/codemirror',
          'node_modules/codemirror/addon/fold/foldcode',
          'node_modules/codemirror/addon/fold/foldgutter',
          'node_modules/codemirror/addon/fold/brace-fold',
          'node_modules/codemirror/addon/display/panel',
          'node_modules/codemirror/mode/javascript/javascript',
          'node_modules/codemirror/mode/sql/sql'
        ],
        src: ['src/demo/demo.js'],
        dest: '.tmp/js/sqlite-parser-demo.js'
      }
    },
    copy: {
      build: {
        files: [{
          filter: 'isFile',
          expand: true,
          cwd: 'src/',
          src: ['*.js'],
          dest: 'lib/'
        }]
      },
      interactive: {
        files: [{
          src: ['src/demo/index.html'],
          flatten: true,
          expand: true,
          dest: '.tmp/'
        }],
      },
      demo: {
        src: ['**/*.{html,css}'],
        expand: true,
        cwd: '.tmp/',
        dest: 'demo/'
      }
    },
    clean: {
      build: ['lib/*.js'],
      dist: ['dist/*.js'],
      interactive: ['.tmp/**/*'],
      demo: ['demo/**/*']
    },
    shell: {
      build: {
        options: {
          failOnError: true
        },
        command: './node_modules/.bin/pegjs --optimize speed src/grammar.pegjs lib/parser.js'
      },
      test: {
        options: {
          failOnError: true
        },
        command: './node_modules/.bin/mocha --reporter=nyan'
      },
      debug: {
        options: {
          failOnError: false,
          debounceDelay: 500,
          forever: true
        },
        command: 'DEBUG=true ./node_modules/.bin/mocha'
      },
      rewrite: {
        options: {
          failOnError: true
        },
        command: 'REWRITE=true ./node_modules/.bin/mocha'
      }
    },
    connect: {
      server: {
        options: {
          port: 8080,
          base: '.tmp',
          livereload: true
        }
      }
    },
    watch: {
      debug: {
        options: {
          debounceDelay: 250,
          livereload: false
        },
        files: [
          'index.js', 'test/*.js', 'src/*.js', 'src/*.pegjs',
          'test/sql/*.sql', 'Gruntfile.js'
        ],
        tasks: ['build', 'shell:debug']
      },
      live: {
        options: {
          debounceDelay: 1000,
          livereload: {
            directory: '.tmp/',
            port: 35729
          },
        },
        files: [
          'index.js', 'src/**/*.{js,pegjs,css,html}', 'Gruntfile.js'
        ],
        tasks: ['interactive']
      }
    },
    uglify: {
      options: {
        screwIE8: true,
        mangle: {
          except: ['sqliteParser']
        },
      },
      dist: {
        files: {
          'dist/sqlite-parser-min.js': ['dist/sqlite-parser.js']
        }
      },
      demo: {
        files: {
          'demo/js/sqlite-parser-demo.js': ['.tmp/js/sqlite-parser-demo.js']
        }
      }
    },
    cssmin: {
      interactive: {
        options: {
          processImport: true
        },
        files: {
          '.tmp/css/sqlite-parser-demo.css': [
            'node_modules/codemirror/lib/codemirror.css',
            'node_modules/codemirror/addon/fold/foldgutter.css',
            'node_modules/codemirror/theme/monokai.css',
            'src/demo/demo.css'
          ]
        }
      }
    },
    usebanner: {
      options: {
        position: 'top',
        linebreak: true
      },
      dist: {
        options: {
          banner: getBanner(false)
        },
        files: {
          src: [
            'dist/sqlite-parser-min.js',
            'dist/sqlite-parser.js',
          ]
        }
      },
      demo: {
        options: {
          banner: getBanner(true)
        },
        files: {
          src: [
            'demo/js/sqlite-parser-demo.js',
          ]
        }
      }
    },
    replace: {
      options: {
        patterns: [
          {
            match: 'VERSION',
            replacement: '<%= pkg.version %>'
          }
        ]
      },
      dist: {
        files: [{
          expand: true,
          cwd: 'dist/',
          src: 'sqlite-parser*.js',
          dest: 'dist/'
        }]
      }
    }
  });

  require('load-grunt-tasks')(grunt);

  grunt.registerTask('default', [
    'build'
  ]);
  grunt.registerTask('build', [
    'clean:build', 'shell:build', 'copy:build'
  ]);
  grunt.registerTask('test', [
    'build', 'shell:test'
  ]);
  grunt.registerTask('debug', [
    'build', 'shell:debug', 'watch:debug'
  ]);
  grunt.registerTask('rewrite-json', [
    'build', 'shell:rewrite'
  ]);
  grunt.registerTask('interactive', [
    'clean:interactive', 'default', 'copy:interactive', 'cssmin:interactive',
    'browserify:interactive'
  ]);
  grunt.registerTask('live', [
    'interactive', 'connect:server', 'watch:live'
  ]);
  grunt.registerTask('demo', [
    'interactive', 'clean:demo', 'copy:demo', 'uglify:demo', 'usebanner:demo'
  ]);
  grunt.registerTask('dist', [
    'default', 'clean:dist', 'browserify:dist', 'uglify:dist', 'replace:dist', 'usebanner:dist'
  ]);
  grunt.registerTask('release', [
    'test', 'dist', 'demo', 'clean:interactive'
  ]);
};
