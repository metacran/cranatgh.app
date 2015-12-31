var express = require('express');
var router = express.Router();
var multiline = require('multiline');

var JENKINS_SERVER = 'jenkins.r-pkg.org:8080';
var JENKINS_PASSWORD = process.env.JENKINS_PASSWORD;
var JENKINS_URL = 'http://admin:' + JENKINS_PASSWORD + '@' + JENKINS_SERVER;
var JENKINS_JOB_NAME = 'cranatgh';
var jenkins = require('jenkins')(JENKINS_URL);

var job_xml = multiline(function(){/*
<?xml version='1.0' encoding='UTF-8'?>
<project>
  <actions/>
  <description></description>
  <keepDependencies>false</keepDependencies>
  <properties>
    <hudson.model.ParametersDefinitionProperty>
      <parameterDefinitions>
        <hudson.model.StringParameterDefinition>
          <name>RPACKAGE</name>
          <description></description>
          <defaultValue></defaultValue>
        </hudson.model.StringParameterDefinition>
      </parameterDefinitions>
    </hudson.model.ParametersDefinitionProperty>
  </properties>
  <scm class="hudson.scm.NullSCM"/>
  <canRoam>true</canRoam>
  <disabled>false</disabled>
  <blockBuildWhenDownstreamBuilding>false</blockBuildWhenDownstreamBuilding>
  <blockBuildWhenUpstreamBuilding>false</blockBuildWhenUpstreamBuilding>
  <triggers/>
  <concurrentBuild>false</concurrentBuild>
  <builders>
    <hudson.tasks.Shell>
      <command>Rscript -e &apos;library(cranatgh)&apos; -e &apos;add_package(&quot;&apos;$RPACKAGE&apos;&quot;)&apos;
</command>
    </hudson.tasks.Shell>
  </builders>
  <publishers/>
  <buildWrappers/>
</project>
*/});

var re_full = new RegExp('^/add/([\\w\\.]+)$');
router.get(re_full, function(req, res) {
    var pkg = req.params[0];
    add_pkg(pkg, res);
})

function add_pkg(pkg, res) {

    add_jenkins_job(function(err) {
	if (err) throw err;

	build_jenkins_job(pkg, function(err) {
	    if (err) throw err;

	    res.set('Content-Type', 'application/json')
		.send({ 'operation': 'add',
			'package': pkg,
			'result': 'OK' })
		.end();
	})
    })
}

function add_jenkins_job(callback) {
    jenkins.job.create(
	JENKINS_JOB_NAME,
	job_xml,
	function(err) {
	    // We ignore errors here, because the job might already
	    // exist. If something is wrong, we'll find it out at
	    // build time, anyway.
	    if (err) console.log(err.message)
	    callback(null)
	})
}

function build_jenkins_job(pkg, callback) {
    jenkins.job.build(
	JENKINS_JOB_NAME,
	{ 'parameters': { 'RPACKAGE': pkg } },
	function(err) {
	    if (err) throw err;
	    callback(null);
	})
}

module.exports = router;
