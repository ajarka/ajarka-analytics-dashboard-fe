pipeline {

    agent any

    triggers {
        githubPush() 
    }

    environment {
        ENV = '.env'
        IMAGE = 'g3n1k/telcodash-fe'
        TAG = 'latest'
        REPO = 'https://github.com/Smartelco/smartelco-analytics-dashboard-fe.git'
        BRANCH = 'master'
        CRED_ID = 'Smartelco-IT'
        DOCKER_ID = 'test-cicd-docker'
        LOG_FILE = "jenkins_error.log"
    }

    stages {

         stage('start build'){
            steps {
                script {
                    sendTelegramMessage("⚙️ Start Build ${IMAGE}:${TAG}")
                }
            }
        }

        stage('clone repo') {
            steps {
                script {
                    try {
                        git branch: "${BRANCH}", credentialsId: "${CRED_ID}", url: "${REPO}"
                    } catch (Exception e) {
                        writeFile file: LOG_FILE, text: "Error cloning repo: ${e.toString()}\n"
                        error("❌ Gagal clone repo. Log telah disimpan.")
                    }
                }
            }
        }

        stage('build image') {
            steps {
                script {
                    try {
                        sh "docker buildx build -t ${IMAGE} ."
                    } catch (Exception e) {
                        writeFile file: LOG_FILE, text: "Error build image: ${e.toString()}\n"
                        error("❌ Gagal build Docker image.")
                    }
                }
            }
        }

        stage('Push Docker Image') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'test-cicd-docker', 
                    usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    script {
                        try {
                            // Login ke Docker Hub
                            sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
                        
                            // Tag dan push image
                            sh "docker push ${IMAGE}:${TAG}"
                       } catch (Exception e) {
                            writeFile file: LOG_FILE, text: "Error push image: ${e.toString()}\n"
                            error("❌ Gagal push Docker image.")
                        }
                    }
                }
            }
        }

        // karena satu pid docker, kita tidak butuh step download image
    }

    post {
        success {
            script {
                sendTelegramMessage("✅ Build sukses! Docker image ${IMAGE}:${TAG} telah di-push.")
            }
            echo "build and push ${IMAGE}:${TAG}"
        }
        failure {
             script {
                sendTelegramMessage("❌ Build atau push gagal ${IMAGE}:${TAG}! Log error terlampir.")
                sendTelegramFile(LOG_FILE)
            }
            echo "Build atau push gagal ${IMAGE}:${TAG}. Log dikirim ke Telegram."
        }
    }
}

def sendTelegramMessage(String message) {
    withCredentials([
        string(credentialsId: 'TELE_BOT_TIRA_TOKEN', variable: 'TELEGRAM_BOT_TOKEN'),
        string(credentialsId: 'TELE_BOT_TIRA_CHAT_ID_PLAYGROUND_BOT', variable: 'TELEGRAM_CHAT_ID')
    ]) {
        sh """
            curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \\
            -d chat_id=${TELEGRAM_CHAT_ID} \\
            -d text="${message}"
        """
    }
}

def sendTelegramFile(String filePath) {
    withCredentials([
        string(credentialsId: 'TELE_BOT_TIRA_TOKEN', variable: 'TELEGRAM_BOT_TOKEN'),
        string(credentialsId: 'TELE_BOT_TIRA_CHAT_ID_PLAYGROUND_BOT', variable: 'TELEGRAM_CHAT_ID')
    ]) {
        sh """
            curl -F chat_id=${TELEGRAM_CHAT_ID} \\
                 -F document=@${filePath} \\
                 "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument"
        """
    }
}
