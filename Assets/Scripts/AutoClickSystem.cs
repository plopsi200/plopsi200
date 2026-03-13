using UnityEngine;
using System.Collections;

public class AutoClickSystem : MonoBehaviour
{
    private float timer = 0f;

    private void Update()
    {
        if (GameManager.Instance.autoClickRate > 0)
        {
            timer += Time.deltaTime;
            if (timer >= 1f)
            {
                GameManager.Instance.AddPoints(GameManager.Instance.autoClickRate);
                timer -= 1f;
            }
        }
    }
}
