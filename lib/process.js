/**
 * Created by AlexanderC on 11/16/15.
 */

'use strict';

var cp = require('child_process');
var path = require('path');
var fs = require('fs');
var crypto = require('crypto');

function _process(cmd, args, opts) {

  /**
   * @param {String} str
   * @returns {String}
   */
  function md5(str) {
    var md5sum = crypto.createHash('md5');

    md5sum.update(str);

    return md5sum.digest('hex');
  }

  return {
    _process: null,
    _pidFile: null,

    /**
     * @returns {pid|Function|null}
     */
    pid: function() {
      return this._process ? this._process.pid : null;
    },

    /**
     * @param {String} dir
     * @returns {String}
     */
    getPidFileFromDir: function(dir) {
      var parts = JSON.stringify(args) + JSON.stringify(opts);

      return path.join(dir, '.' + md5(cmd) + md5(parts));
    },

    /**
     * Start process
     *
     * @param {String} pidFile
     * @returns {ChildProcess}
     */
    start: function(pidFile) {
      if (!pidFile) {
        throw new Error('PID file is required');
      }

      this._pidFile = pidFile;

      var runningProcessPid = this.pid() || this._getOldProcessPid();

      if (runningProcessPid) {
        throw new Error('Process has already been started (PID #' + runningProcessPid +')');
      }

      this._process = cp.spawn(cmd, args, opts);

      this._process.on('exit', this._cleanup);
      this._process.on('uncaughtException', this._cleanup);
      this._process.on('error', this._cleanup);

      this._persistPid();

      return this._process;
    },

    /**
     * Stop process
     */
    stop: function() {
      this._cleanup();

      this._process = null;
      this._pidFile = null;
    },

    /**
     * @private
     */
    _cleanup: function() {
      this._removePidFile();
    },

    /**
     * @private
     */
    _persistPid: function() {
      fs.writeFileSync(this._pidFile, this.pid());
    },

    /**
     * @private
     */
    _removePidFile: function() {
      fs.unlinkSync(this._pidFile);
    },

    /**
     * @returns {String|null}
     * @private
     */
    _getOldProcessPid: function() {
      if (fs.existsSync(this._pidFile)) {
        var oldPid = fs.readFileSync(this._pidFile).toString();

        try {
          process.kill(oldPid, 0);

          return oldPid;
        } catch(error) {
          // @todo: force old pid file removal?
          //fs.unlinkSync(this._pidFile);
        }
      }

      return null;
    }
  };
}

module.exports = _process;
