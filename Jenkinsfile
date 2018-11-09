node {
  env.NODEJS_HOME = "${tool 'node'}"
  env.PATH="${env.NODEJS_HOME}/bin:${env.PATH}"

  def build="gamblingpro.cabinet.build$BUILD_NUMBER";
  def remoteDir="/var/www/yb.partners/frontend/cabinet";

  def remote = [:]
  remote.name = 'gamblingpro-base1'
  remote.host = '185.26.97.115'
  remote.user = 'root'
  remote.identityFile = '~/.ssh/id_rsa'
  remote.allowAnyHosts = true
  def branchName = scm.branches[0].name.replaceAll("\\*\\/", "")

  stage(name: 'checkout') {
    try {
      notifySlack("started build @ $build")
      sh 'rm -f build.tgz'
      git(
        branch: branchName,
        credentialsId: 'jenkins ssh key',
        url: 'git@bitbucket.org:yougomedia/gamblingpro.cabinet.git'
      )
    } catch (error) {
      notifySlack("stage checkout failed @ $build")
      throw error
    }
  }

  stage(name: 'install node_modules') {
    try {
      sh 'npm i'
    } catch (error) {
      notifySlack("stage install node_modules failed @ $build")
      throw error
    }
  }

  stage(name: 'build script') {
    try {
      sh 'npm run build'
    } catch (error) {
      notifySlack("stage build script failed @ $build")
      sh 'git reset --hard HEAD'
      throw error
    }
  }

  stage(name: 'deploy') {
    try {
      sh 'tar -zcf build.tgz build'
      sshPut(
        remote: remote,
        from: 'build.tgz',
        into: "$remoteDir/"
      )
      sshCommand(
        remote: remote,
        command: "cd ${remoteDir} && tar -zxf build.tgz && rm build.tgz"
      )
    } catch (error) {
      notifySlack("stage deploy failed @ $build")
      sh 'git reset --hard HEAD'
      throw error
    }
  }

  stage(name: 'build docker image') {
    try {
      docker.withRegistry('http://docker.rain.wtf', 'docker.rain.wtf') {
          def customImage = docker.build("gamblingpro-cabinet", "-f ${env.WORKSPACE}/Dockerfile ${env.WORKSPACE}/build")
          customImage.push()
      }
    } catch (error) {
      notifySlack("stage build docker image failed @ $build")
      throw error
    }
  }

  stage(name: 'cleanup') {
    try {
      sh 'rm build.tgz'
      sh 'git reset --hard HEAD'
    } catch (error) {
      notifySlack("stage cleanup failed @ $build")
      throw error
    }
  }

  stage(name: 'notify') {
    notifySlack("success build $build", 'good')
  }
}

def notifySlack(message, color = 'danger') {
  println(message)
  // slackSend(
  //   botUser: true,
  //   channel: 'prodbuild',
  //   color: color,
  //   message: message,
  //   baseUrl: 'https://yourbeteam.slack.com/services/hooks/jenkins-ci/',
  //   tokenCredentialId: 'slack-yourbeteam-token'
  // )
}
