pipeline {
  agent {
    docker {
      image 'node:8'
    }

  }
  stages {
    stage('SonarQube analysis') {
      steps {
        script {
          def scannerHome = tool 'SonarQube Scanner 2.7';
          withSonarQubeEnv('sonar') {
            sh "${scannerHome}/bin/sonar-scanner"
          }
        }

      }
    }
  }
}