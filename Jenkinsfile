pipeline {
  agent {
    docker {
      image 'maven:3-alpine'
    }

  }
  stages {
    stage('SonarQube analysis') {
      steps {
        script {
          def scannerHome = tool 'sonarqube-scanner';
          withSonarQubeEnv('sonar') {
            sh '${scannerHome}/bin/sonar-scanner '+
            '-f all/pom.xml ' +
            '-Dsonar.projectKey=entry.entryHW ' +
            '-Dsonar.projectName=EntryHW ' +
            '-Dsonar.sourceEncoding=UTF-8 ' +
            '-Dsonar.analysis.mode=preview ' +
            '-Dsonar.sources=app '
          }
        }

      }
    }
  }
}