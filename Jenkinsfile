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
          withSonarQubeEnv('sonar') {
            echo 'sonar'
          }
        }

      }
    }
  }
}