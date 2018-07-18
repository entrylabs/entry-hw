pipeline {
  agent {
    docker {
      image 'maven:3-alpine'
    }
  }
  stages {
    stage('SonarQube analysis') {
      when { changeRequest() }
      steps {
        script {
          def scannerHome = tool "sonarqube-scanner";
          withSonarQubeEnv("sonar") {
            sh "${scannerHome}/bin/sonar-scanner " +
            "-Dsonar.projectKey=entry.entryHW " +
            "-Dsonar.projectName=EntryHW " +
            "-Dsonar.sourceEncoding=UTF-8 " +
            "-Dsonar.analysis.mode=preview " +
            "-Dsonar.github.repository=entrylabs/entry-hw " +
            "-Dsonar.github.endpoint=https://api.github.com " +
            "-Dsonar.github.oauth=${GH_TOKEN} " +
            "-Dsonar.issuesReport.console.enable=true " +
            "-Dsonar.github.disableInlineComments=true " +
            "-Dsonar.github.pullRequest=${env.CHANGE_ID} " +
            "-Dsonar.sources=app "
          }
        }
      }
    }
    stage('SonarQube scan') {
      when { changeRequest() }
      steps {
        script {
          def scannerHome = tool "sonarqube-scanner";
          withSonarQubeEnv("sonar") {
            sh "${scannerHome}/bin/sonar-scanner " +
            "-Dsonar.projectKey=entry.entryHW " +
            "-Dsonar.projectName=EntryHW " +
            "-Dsonar.sourceEncoding=UTF-8 " +
            "-Dsonar.sources=app "
          }
        }
      }
    }
  }
}