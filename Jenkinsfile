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
          def scannerHome = tool 'sonarqube-scanner';
          withSonarQubeEnv('sonar') {
            sh "sudo ${scannerHome}/bin/sonar-scanner"
          }
        }

      }
    }
  }
}